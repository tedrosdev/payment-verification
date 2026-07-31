import { Controller, Post, Get, Body, Query, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentSubmissionsService } from './payment-submissions.service';
import { CreateSubmissionDto, SubmissionStatus } from '@payment-verification/types';

@ApiTags('Payment Submissions')
@ApiBearerAuth('JWT-auth')
@Controller()
export class PaymentSubmissionsController {
  constructor(private readonly submissionsService: PaymentSubmissionsService) {}

  @Post('batches/:batchId/submissions')
  @ApiOperation({
    summary: 'Submit & verify payment reference',
    description:
      'Performs local deduplication check, calls Verify.ET synchronously, validates settlement matching, calculates ticket count (Math.floor(amount / ticketPrice)), and generates sequential ticket codes (AA01..).',
  })
  @ApiResponse({ status: 201, description: 'Payment reference verified and tickets issued' })
  @ApiResponse({ status: 400, description: 'Invalid payload or closed batch' })
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
  @ApiOperation({ summary: 'List payment submissions audit log' })
  @ApiResponse({ status: 200, description: 'Submissions list retrieved' })
  async findAll(
    @Query('batchId') batchId?: string,
    @Query('status') status?: SubmissionStatus,
  ) {
    return this.submissionsService.findAll(batchId, status);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get overview dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  async getDashboardStats() {
    return this.submissionsService.getDashboardStats();
  }
}
