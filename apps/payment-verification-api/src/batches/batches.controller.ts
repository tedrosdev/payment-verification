import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { CreateBatchDto, BatchStatus } from '@payment-verification/types';

@ApiTags('Giveaway Batches')
@ApiBearerAuth('JWT-auth')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all batches', description: 'Returns all promotional giveaway batches with ticket metrics.' })
  @ApiResponse({ status: 200, description: 'Batches list retrieved' })
  async findAll() {
    return this.batchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get batch by ID', description: 'Returns detailed batch information and submission stats.' })
  @ApiResponse({ status: 200, description: 'Batch details retrieved' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new batch', description: 'Creates a new promotional batch with custom ticket pricing.' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  async create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update batch status', description: 'Changes batch status to ACTIVE, CLOSED, or ARCHIVED.' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: BatchStatus) {
    return this.batchesService.updateStatus(id, status);
  }
}
