import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export function generateTicketCode(ticketNumber: number): string {
  const prefixIndex = Math.floor((ticketNumber - 1) / 99);
  const num = ((ticketNumber - 1) % 99) + 1;
  const firstChar = String.fromCharCode(65 + Math.floor(prefixIndex / 26));
  const secondChar = String.fromCharCode(65 + (prefixIndex % 26));
  const numStr = num.toString().padStart(2, '0');
  return `${firstChar}${secondChar}${numStr}`;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBatch(batchId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { batchId },
      orderBy: { ticketNumber: 'asc' },
    });

    return tickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async findAll(batchId?: string, participantPhone?: string) {
    const where: any = {};
    if (batchId) where.batchId = batchId;
    if (participantPhone) where.participantPhone = { contains: participantPhone };

    const tickets = await this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return tickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }));
  }
}
