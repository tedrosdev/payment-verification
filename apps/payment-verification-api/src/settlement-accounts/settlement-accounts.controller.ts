import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementAccountsService } from './settlement-accounts.service';
import { CreateSettlementAccountDto, BankType } from '@payment-verification/types';

@ApiTags('Settlement Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('settlement-accounts')
export class SettlementAccountsController {
  constructor(private readonly service: SettlementAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List settlement accounts', description: 'Retrieves all configured bank settlement accounts.' })
  @ApiResponse({ status: 200, description: 'Accounts list retrieved' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':bank')
  @ApiOperation({ summary: 'Get settlement account by bank', description: 'Returns settlement account details for a specific bank.' })
  @ApiResponse({ status: 200, description: 'Account retrieved' })
  @ApiResponse({ status: 404, description: 'Bank settlement account not found' })
  async findByBank(@Param('bank') bank: BankType) {
    return this.service.findByBank(bank);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update settlement account', description: 'Upserts bank settlement account configuration (account number, suffix).' })
  @ApiResponse({ status: 200, description: 'Account configured successfully' })
  async createOrUpdate(@Body() dto: CreateSettlementAccountDto) {
    return this.service.createOrUpdate(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle settlement account active status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.toggleActive(id, isActive);
  }
}
