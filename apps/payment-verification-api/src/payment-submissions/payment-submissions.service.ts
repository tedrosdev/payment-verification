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

    // 2. Check for existing submission in database
    const existingSubmission = await this.prisma.paymentSubmission.findFirst({
      where: {
        bank: dto.bank,
        referenceNumber: normalizedRef,
      },
      include: { tickets: true },
    });

    // If already verified AND has tickets assigned, return DUPLICATE
    if (existingSubmission && existingSubmission.status === 'VERIFIED' && existingSubmission.tickets.length > 0) {
      this.logger.warn(`Duplicate submission attempt for already verified reference ${dto.bank}:${normalizedRef}`);
      return {
        id: existingSubmission.id,
        batchId: existingSubmission.batchId,
        bank: existingSubmission.bank as BankType,
        referenceNumber: existingSubmission.referenceNumber,
        participantPhone: existingSubmission.participantPhone,
        participantName: existingSubmission.participantName || undefined,
        amount: existingSubmission.amount,
        status: 'DUPLICATE' as SubmissionStatus,
        rejectionReason: 'Payment reference number has already been verified and ticket issued.',
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
      const rejectedRecord = existingSubmission
        ? await this.prisma.paymentSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              batchId: dto.batchId,
              status: 'REJECTED',
              rejectionReason: `No active settlement account configured for bank ${dto.bank}`,
            },
          })
        : await this.prisma.paymentSubmission.create({
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
        id: rejectedRecord.id,
        batchId: rejectedRecord.batchId,
        bank: rejectedRecord.bank as BankType,
        referenceNumber: rejectedRecord.referenceNumber,
        participantPhone: rejectedRecord.participantPhone,
        participantName: rejectedRecord.participantName || undefined,
        amount: 0,
        status: 'REJECTED' as SubmissionStatus,
        rejectionReason: rejectedRecord.rejectionReason || undefined,
        tickets: [],
        createdAt: rejectedRecord.createdAt.toISOString(),
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

      const failedRecord = existingSubmission
        ? await this.prisma.paymentSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              batchId: dto.batchId,
              participantPhone: dto.participantPhone,
              participantName: dto.participantName || verifyResult.payerName,
              amount: verifyResult.amount || 0,
              status,
              rejectionReason,
              verifyEtRequestId: verifyResult.requestId,
              verifyEtRawResponse: (verifyResult.raw as any) || {},
            },
          })
        : await this.prisma.paymentSubmission.create({
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
        id: failedRecord.id,
        batchId: failedRecord.batchId,
        bank: failedRecord.bank as BankType,
        referenceNumber: failedRecord.referenceNumber,
        participantPhone: failedRecord.participantPhone,
        participantName: failedRecord.participantName || undefined,
        amount: failedRecord.amount,
        status,
        rejectionReason,
        tickets: [],
        verifyEtRequestId: verifyResult.requestId,
        createdAt: failedRecord.createdAt.toISOString(),
      };
    }

    // 6. Mandatory Check: Deposited price MUST be >= batch ticket price
    if (verifyResult.amount < batch.ticketPrice) {
      this.logger.warn(
        `[Insufficient Payment] Deposited amount (${verifyResult.amount} ETB) is less than required batch ticket price (${batch.ticketPrice} ETB) for batch ${batch.name}`,
      );

      const rejectedRecord = existingSubmission
        ? await this.prisma.paymentSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              batchId: dto.batchId,
              participantPhone: dto.participantPhone,
              participantName: dto.participantName || verifyResult.payerName,
              amount: verifyResult.amount,
              status: 'REJECTED',
              rejectionReason: `Payment deposited amount (${verifyResult.amount} ETB) is less than required batch ticket price (${batch.ticketPrice} ETB)`,
              verifyEtRequestId: verifyResult.requestId,
              verifyEtRawResponse: (verifyResult.raw as any) || {},
            },
          })
        : await this.prisma.paymentSubmission.create({
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
        id: rejectedRecord.id,
        batchId: rejectedRecord.batchId,
        bank: rejectedRecord.bank as BankType,
        referenceNumber: rejectedRecord.referenceNumber,
        participantPhone: rejectedRecord.participantPhone,
        participantName: rejectedRecord.participantName || undefined,
        amount: verifyResult.amount,
        status: 'REJECTED' as SubmissionStatus,
        rejectionReason: rejectedRecord.rejectionReason || undefined,
        tickets: [],
        verifyEtRequestId: verifyResult.requestId,
        createdAt: rejectedRecord.createdAt.toISOString(),
      };
    }

    // 7. Success Branch: Atomic transaction to update/create submission & issue 1 ticket
    return this.prisma.$transaction(async (tx) => {
      const maxTicket = await tx.ticket.findFirst({
        where: { batchId: dto.batchId },
        orderBy: { ticketNumber: 'desc' },
        select: { ticketNumber: true },
      });

      const nextTicketNum = (maxTicket?.ticketNumber || 0) + 1;

      const submission = existingSubmission
        ? await tx.paymentSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              batchId: dto.batchId,
              participantPhone: dto.participantPhone,
              participantName: dto.participantName || verifyResult.payerName,
              amount: verifyResult.amount,
              status: 'VERIFIED',
              rejectionReason: null,
              verifyEtRequestId: verifyResult.requestId,
              verifyEtRawResponse: (verifyResult.raw as any) || {},
            },
          })
        : await tx.paymentSubmission.create({
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

      const code = generateTicketCode(nextTicketNum);

      await tx.ticket.create({
        data: {
          batchId: dto.batchId,
          submissionId: submission.id,
          code,
          ticketNumber: nextTicketNum,
          participantPhone: dto.participantPhone,
          participantName: dto.participantName || verifyResult.payerName,
        },
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
