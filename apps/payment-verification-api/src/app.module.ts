import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SettlementAccountsModule } from './settlement-accounts/settlement-accounts.module';
import { BatchesModule } from './batches/batches.module';
import { VerifyEtModule } from './verify-et/verify-et.module';
import { PaymentSubmissionsModule } from './payment-submissions/payment-submissions.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    SettlementAccountsModule,
    BatchesModule,
    VerifyEtModule,
    PaymentSubmissionsModule,
    TicketsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
