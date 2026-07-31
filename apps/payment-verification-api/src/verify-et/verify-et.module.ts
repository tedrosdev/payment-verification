import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VerifyEtService } from './verify-et.service';

@Module({
  imports: [ConfigModule],
  providers: [VerifyEtService],
  exports: [VerifyEtService],
})
export class VerifyEtModule {}
