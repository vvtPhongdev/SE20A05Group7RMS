import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Gateway health check' })
  check() {
    return { status: 'ok', service: 'gateway', timestamp: new Date().toISOString() };
  }
}
