import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';

/**
 * Thin proxy controller for Review service (reviewer feedback, packets).
 */
@ApiTags('Review')
@ApiBearerAuth()
@Controller()
export class ReviewController {
  constructor(
    @Inject(SERVICE_TOKENS.REVIEW) private readonly reviewClient: ClientProxy,
  ) {}

  // ─── Reviewer Feedback ───────────────────────────────────────────

  @Post('reviewer-feedback')
  @ApiOperation({ summary: 'Submit reviewer feedback' })
  createFeedback(@Body() body: any) {
    return firstValueFrom(this.reviewClient.send('feedback.create', body));
  }

  @Get('reviewer-feedback')
  @ApiOperation({ summary: 'List reviewer feedback' })
  listFeedback(@Query() query: any) {
    return firstValueFrom(this.reviewClient.send('feedback.list', query));
  }

  @Get('reviewer-feedback/:id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  getFeedback(@Param('id') id: string) {
    return firstValueFrom(this.reviewClient.send('feedback.get', { id }));
  }

  // ─── Packets ─────────────────────────────────────────────────────

  @Post('packets')
  @ApiOperation({ summary: 'Create decision packet' })
  createPacket(@Body() body: any) {
    return firstValueFrom(this.reviewClient.send('packets.create', body));
  }

  @Get('packets')
  @ApiOperation({ summary: 'List decision packets' })
  listPackets(@Query() query: any) {
    return firstValueFrom(this.reviewClient.send('packets.list', query));
  }

  @Get('packets/:id')
  @ApiOperation({ summary: 'Get packet by ID' })
  getPacket(@Param('id') id: string) {
    return firstValueFrom(this.reviewClient.send('packets.get', { id }));
  }
}
