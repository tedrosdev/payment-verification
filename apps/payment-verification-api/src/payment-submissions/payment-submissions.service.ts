import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyEtService } from '../verify-et/verify-et.service';
import { generateTicketCode } from '../tickets/tickets.service';
import { CreateSubmissionDto, SubmissionStatus, BankType } from '@payment-verification/types';

@Injectable()
export class PaymentSubmissionsService {
  private readonly logger = new Logger(PaymentSubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifyEtService: VerifyEtService,
  ) {}

  async submitAndVerify(dto: CreateSubmissionDto, adminId: string) {
    const normalizedRef = dto.referenceNumber.trim().toUpperCase();

    // 1. Verify batch exists & is active
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${dto.batchId} not found`);
    }

    if (batch.status !== 'ACTIVE') {
      throw new BadRequestException(`Batch "${batch.name}" is currently ${batch.status}. Cannot process submissions.`);
    }

    // 2. Local deduplication check (cheap check before calling external API)
    const existingSubmission = await this.prisma.paymentSubmission.findFirst({
      where: {
        bank: dto.bank,
        referenceNumber: normalizedRef,
        status: 'VERIFIED',
      },
      include: { tickets: true },
    });

    if (existingSubmission) {
      this.logger.warn(`Duplicate submission attempt for ${dto.bank}:${normalizedRef}`);
      return {
        id: existingSubmission.id,
        batchId: existingSubmission.batchId,
        bank: existingSubmission.bank as BankType,
        referenceNumber: existingSubmission.referenceNumber,
        participantPhone: existingSubmission.participantPhone,
        participantName: existingSubmission.participantName || undefined,
        amount: existingSubmission.amount,
        status: 'DUPLICATE' as SubmissionStatus,
        rejectionReason: 'Payment reference number has already been verified and processed in the system.',
        tickets: existingSubmission.tickets.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })),
        verifyEtRequestId: existingSubmission.verifyEtRequestId || undefined,
        createdAt: existingSubmission.createdAt.toISOString(),
      };
    }

    // 3. Settlement Account lookup
    const settlementAccount = await this.prisma.settlementAccount.findUnique({
      where: { bank: dto.bank },
    });

    if (!settlementAccount || !settlementAccount.isActive) {
      const rejectedSubmission = await this.prisma.paymentSubmission.create({
        data: {
          batchId: dto.batchId,
          bank: dto.bank,
          referenceNumber: normalizedRef,
          participantPhone: dto.participantPhone,
          participantName: dto.participantName,
          amount: 0,
          status: 'REJECTED',
          rejectionReason: `No active settlement account configured for bank ${dto.bank}`,
          createdById: adminId,
        },
      });

      return {
        id: rejectedSubmission.id,
        batchId: rejectedSubmission.batchId,
        bank: rejectedSubmission.bank as BankType,
        referenceNumber: rejectedSubmission.referenceNumber,
        participantPhone: rejectedSubmission.participantPhone,
        participantName: rejectedSubmission.participantName || undefined,
        amount: 0,
        status: 'REJECTED' as SubmissionStatus,
        rejectionReason: rejectedSubmission.rejectionReason || undefined,
        tickets: [],
        createdAt: rejectedSubmission.createdAt.toISOString(),
      };
    }

    // 4. Call external Verify.ET API
    const verifyResult = await this.verifyEtService.verifyPayment(
      dto.bank,
      normalizedRef,
      settlementAccount.accountSuffix || undefined,
    );

    // 5. Handle verification failure branches
    if (!verifyResult.verified) {
      const rejectionReason = verifyResult.reason || 'Verification failed';
      const status: SubmissionStatus = verifyResult.confirmedBefore ? 'DUPLICATE' : 'REJECTED';

      try {
        const failedSubmission = await this.prisma.paymentSubmission.create({
          data: {
            batchId: dto.batchId,
            bank: dto.bank,
            referenceNumber: normalizedRef,
            participantPhone: dto.participantPhone,
            participantName: dto.participantName || verifyResult.payerName,
            amount: verifyResult.amount || 0,
            status,
            rejectionReason,
            verifyEtRequestId: verifyResult.requestId,
            verifyEtRawResponse: (verifyResult.raw as any) || {},
            createdById: adminId,
          },
        });

        return {
          id: failedSubmission.id,
          batchId: failedSubmission.batchId,
          bank: failedSubmission.bank as BankType,
          referenceNumber: failedSubmission.referenceNumber,
          participantPhone: failedSubmission.participantPhone,
          participantName: failedSubmission.participantName || undefined,
          amount: failedSubmission.amount,
          status,
          rejectionReason,
          tickets: [],
          verifyEtRequestId: verifyResult.requestId,
          createdAt: failedSubmission.createdAt.toISOString(),
        };
      } catch (dbErr: any) {
        if (dbErr?.code === 'P2002') {
          this.logger.warn(`[Duplicate DB Record] Bank ${dto.bank} Ref ${normalizedRef} already recorded in DB.`);
          return {
            id: `dup-${Date.now()}`,
            batchId: dto.batchId,
            bank: dto.bank as BankType,
            referenceNumber: normalizedRef,
            participantPhone: dto.participantPhone,
            participantName: dto.participantName,
            amount: verifyResult.amount || 0,
            status: 'DUPLICATE' as SubmissionStatus,
            rejectionReason: 'Payment reference number has already been submitted to the system.',
            tickets: [],
            verifyEtRequestId: verifyResult.requestId,
            createdAt: new Date().toISOString(),
          };
        }
        throw dbErr;
      }
    }

    // 6. Mandatory Check: Deposited price MUST be >= batch ticket price
    if (verifyResult.amount < batch.ticketPrice) {
      this.logger.warn(
        `[Insufficient Payment] Deposited amount (${verifyResult.amount} ETB) is less than required batch ticket price (${batch.ticketPrice} ETB) for batch ${batch.name}`,
      );

      const rejectedSubmission = await this.prisma.paymentSubmission.create({
        data: {
          batchId: dto.batchId,
          bank: dto.bank,
          referenceNumber: normalizedRef,
          participantPhone: dto.participantPhone,
          participantName: dto.participantName || verifyResult.payerName,
          amount: verifyResult.amount,
          status: 'REJECTED',
          rejectionReason: `Payment deposited amount (${verifyResult.amount} ETB) is less than required batch ticket price (${batch.ticketPrice} ETB)`,
          verifyEtRequestId: verifyResult.requestId,
          verifyEtRawResponse: (verifyResult.raw as any) || {},
          createdById: adminId,
        },
      });

      return {
        id: rejectedSubmission.id,
        batchId: rejectedSubmission.batchId,
        bank: rejectedSubmission.bank as BankType,
        referenceNumber: rejectedSubmission.referenceNumber,
        participantPhone: rejectedSubmission.participantPhone,
        participantName: rejectedSubmission.participantName || undefined,
        amount: verifyResult.amount,
        status: 'REJECTED' as SubmissionStatus,
        rejectionReason: rejectedSubmission.rejectionReason || undefined,
        tickets: [],
        verifyEtRequestId: verifyResult.requestId,
        createdAt: rejectedSubmission.createdAt.toISOString(),
      };
    }

    // 7. Atomic transaction: create submission & issue tickets
    return this.prisma.$transaction(async (tx) => {
      // Find current max ticket number for batch
      const maxTicket = await tx.ticket.findFirst({
        where: { batchId: dto.batchId },
        orderBy: { ticketNumber: 'desc' },
        select: { ticketNumber: true },
      });

      let startTicketNum = (maxTicket?.ticketNumber || 0) + 1;

      const submission = await tx.paymentSubmission.create({
        data: {
          batchId: dto.batchId,
          bank: dto.bank,
          referenceNumber: normalizedRef,
          participantPhone: dto.participantPhone,
          participantName: dto.participantName || verifyResult.payerName,
          amount: verifyResult.amount,
          status: 'VERIFIED',
          verifyEtRequestId: verifyResult.requestId,
          verifyEtRawResponse: (verifyResult.raw as any) || {},
          createdById: adminId,
        },
      });

      const ticketCount = 1;
      const ticketsToCreate = [];
      for (let i = 0; i < ticketCount; i++) {
        const ticketNum = startTicketNum + i;
        const code = generateTicketCode(ticketNum);

        ticketsToCreate.push({
          batchId: dto.batchId,
          submissionId: submission.id,
          code,
          ticketNumber: ticketNum,
          participantPhone: dto.participantPhone,
          participantName: dto.participantName || verifyResult.payerName,
        });
      }

      await tx.ticket.createMany({
        data: ticketsToCreate,
      });

      const createdTickets = await tx.ticket.findMany({
        where: { submissionId: submission.id },
        orderBy: { ticketNumber: 'asc' },
      });

      return {
        id: submission.id,
        batchId: submission.batchId,
        bank: submission.bank as BankType,
        referenceNumber: submission.referenceNumber,
        participantPhone: submission.participantPhone,
        participantName: submission.participantName || undefined,
        amount: submission.amount,
        status: 'VERIFIED' as SubmissionStatus,
        tickets: createdTickets.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })),
        verifyEtRequestId: submission.verifyEtRequestId || undefined,
        createdAt: submission.createdAt.toISOString(),
      };
    });
  }

  async findAll(batchId?: string, status?: SubmissionStatus) {
    const where: any = {};
    if (batchId) where.batchId = batchId;
    if (status) where.status = status;

    const submissions = await this.prisma.paymentSubmission.findMany({
      where,
      include: { tickets: true, createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return submissions.map((s) => ({
      id: s.id,
      batchId: s.batchId,
      bank: s.bank as BankType,
      referenceNumber: s.referenceNumber,
      participantPhone: s.participantPhone,
      participantName: s.participantName || undefined,
      amount: s.amount,
      status: s.status as SubmissionStatus,
      rejectionReason: s.rejectionReason || undefined,
      tickets: s.tickets.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
      verifyEtRequestId: s.verifyEtRequestId || undefined,
      verifyEtRawResponse: s.verifyEtRawResponse || undefined,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getDashboardStats() {
    const [activeBatches, totalSubmissions, verifiedSubmissions, totalTickets, recentSubmissions] =
      await Promise.all([
        this.prisma.batch.count({ where: { status: 'ACTIVE' } }),
        this.prisma.paymentSubmission.count(),
        this.prisma.paymentSubmission.count({ where: { status: 'VERIFIED' } }),
        this.prisma.ticket.count(),
        this.findAll(undefined, undefined),
      ]);

    return {
      activeBatchesCount: activeBatches,
      totalSubmissionsCount: totalSubmissions,
      verifiedSubmissionsCount: verifiedSubmissions,
      totalTicketsIssuedCount: totalTickets,
      recentSubmissions: recentSubmissions.slice(0, 10),
    };
  }
}
