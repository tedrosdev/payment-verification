import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto, BatchStatus } from '@payment-verification/types';

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const batches = await this.prisma.batch.findMany({
      include: {
        _count: {
          select: {
            submissions: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      batches.map(async (batch) => {
        const verifiedSubmissionsCount = await this.prisma.paymentSubmission.count({
          where: { batchId: batch.id, status: 'VERIFIED' },
        });

        return {
          id: batch.id,
          name: batch.name,
          ticketPrice: batch.ticketPrice,
          status: batch.status as any,
          description: batch.description,
          totalSubmissions: batch._count.submissions,
          totalVerifiedSubmissions: verifiedSubmissionsCount,
          totalTicketsIssued: batch._count.tickets,
          createdAt: batch.createdAt.toISOString(),
          updatedAt: batch.updatedAt.toISOString(),
        };
      }),
    );
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
            tickets: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    const verifiedCount = await this.prisma.paymentSubmission.count({
      where: { batchId: id, status: 'VERIFIED' },
    });

    return {
      id: batch.id,
      name: batch.name,
      ticketPrice: batch.ticketPrice,
      status: batch.status as any,
      description: batch.description,
      totalSubmissions: batch._count.submissions,
      totalVerifiedSubmissions: verifiedCount,
      totalTicketsIssued: batch._count.tickets,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateBatchDto) {
    const batch = await this.prisma.batch.create({
      data: {
        name: dto.name,
        ticketPrice: dto.ticketPrice,
        description: dto.description,
        status: 'ACTIVE',
      },
    });

    return {
      ...batch,
      totalSubmissions: 0,
      totalVerifiedSubmissions: 0,
      totalTicketsIssued: 0,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  async updateStatus(id: string, status: BatchStatus) {
    const batch = await this.prisma.batch.update({
      where: { id },
      data: { status },
    });

    return {
      ...batch,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }
}
