import { Controller, Post, Get, Body, Query, Param, Request } from '@nestjs/common';
import { PaymentSubmissionsService } from './payment-submissions.service';
import { CreateSubmissionDto, SubmissionStatus } from '@payment-verification/types';

@Controller()
export class PaymentSubmissionsController {
  constructor(private readonly submissionsService: PaymentSubmissionsService) {}

  @Post('batches/:batchId/submissions')
  async submitAndVerify(
    @Param('batchId') batchId: string,
    @Body() dto: Omit<CreateSubmissionDto, 'batchId'>,
    @Request() req: any,
  ) {
    return this.submissionsService.submitAndVerify(
      { ...dto, batchId },
      req.user.id,
    );
  }

  @Get('submissions')
  async findAll(
    @Query('batchId') batchId?: string,
    @Query('status') status?: SubmissionStatus,
  ) {
    return this.submissionsService.findAll(batchId, status);
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.submissionsService.getDashboardStats();
  }
}
