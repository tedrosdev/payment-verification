import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { SettlementAccountsService } from './settlement-accounts.service';
import { CreateSettlementAccountDto, BankType } from '@payment-verification/types';

@Controller('settlement-accounts')
export class SettlementAccountsController {
  constructor(private readonly service: SettlementAccountsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':bank')
  async findByBank(@Param('bank') bank: BankType) {
    return this.service.findByBank(bank);
  }

  @Post()
  async createOrUpdate(@Body() dto: CreateSettlementAccountDto) {
    return this.service.createOrUpdate(dto);
  }

  @Patch(':id/status')
  async toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.toggleActive(id, isActive);
  }
}
