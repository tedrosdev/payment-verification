import { Module } from '@nestjs/common';
import { SettlementAccountsService } from './settlement-accounts.service';
import { SettlementAccountsController } from './settlement-accounts.controller';

@Module({
  providers: [SettlementAccountsService],
  controllers: [SettlementAccountsController],
  exports: [SettlementAccountsService],
})
export class SettlementAccountsModule {}
