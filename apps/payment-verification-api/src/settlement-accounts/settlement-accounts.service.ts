import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettlementAccountDto, BankType } from '@payment-verification/types';

@Injectable()
export class SettlementAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const accounts = await this.prisma.settlementAccount.findMany({
      orderBy: { bank: 'asc' },
    });

    return accounts.map((acc) => ({
      ...acc,
      createdAt: acc.createdAt.toISOString(),
      updatedAt: acc.updatedAt.toISOString(),
    }));
  }

  async findByBank(bank: BankType) {
    const account = await this.prisma.settlementAccount.findUnique({
      where: { bank },
    });

    if (!account) {
      throw new NotFoundException(`No settlement account configured for bank: ${bank}`);
    }

    return {
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  async createOrUpdate(dto: CreateSettlementAccountDto) {
    const account = await this.prisma.settlementAccount.upsert({
      where: { bank: dto.bank },
      update: {
        accountNumber: dto.accountNumber,
        accountSuffix: dto.accountSuffix,
        accountHolderName: dto.accountHolderName,
        isActive: dto.isActive ?? true,
      },
      create: {
        bank: dto.bank,
        accountNumber: dto.accountNumber,
        accountSuffix: dto.accountSuffix,
        accountHolderName: dto.accountHolderName,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  async toggleActive(id: string, isActive: boolean) {
    const account = await this.prisma.settlementAccount.update({
      where: { id },
      data: { isActive },
    });

    return {
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
