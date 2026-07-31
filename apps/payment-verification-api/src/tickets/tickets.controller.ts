import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets Ledger')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List tickets', description: 'Returns issued ticket codes filterable by batch or phone number.' })
  @ApiResponse({ status: 200, description: 'Tickets list retrieved' })
  async findAll(
    @Query('batchId') batchId?: string,
    @Query('participantPhone') participantPhone?: string,
  ) {
    return this.ticketsService.findAll(batchId, participantPhone);
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'List tickets by batch ID' })
  @ApiResponse({ status: 200, description: 'Batch tickets retrieved' })
  async findByBatch(@Param('batchId') batchId: string) {
    return this.ticketsService.findByBatch(batchId);
  }
}
