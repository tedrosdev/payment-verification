import { Module } from '@nestjs/common';
import { PaymentSubmissionsService } from './payment-submissions.service';
import { PaymentSubmissionsController } from './payment-submissions.controller';
import { VerifyEtModule } from '../verify-et/verify-et.module';

@Module({
  imports: [VerifyEtModule],
  providers: [PaymentSubmissionsService],
  controllers: [PaymentSubmissionsController],
  exports: [PaymentSubmissionsService],
})
export class PaymentSubmissionsModule {}
