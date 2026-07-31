import { Controller, Get, Query, Param } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll(
    @Query('batchId') batchId?: string,
    @Query('participantPhone') participantPhone?: string,
  ) {
    return this.ticketsService.findAll(batchId, participantPhone);
  }

  @Get('batch/:batchId')
  async findByBatch(@Param('batchId') batchId: string) {
    return this.ticketsService.findByBatch(batchId);
  }
}
