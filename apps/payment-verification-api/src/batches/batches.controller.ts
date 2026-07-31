import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto, BatchStatus } from '@payment-verification/types';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  async findAll() {
    return this.batchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: BatchStatus) {
    return this.batchesService.updateStatus(id, status);
  }
}
