import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(SERVICE_TOKENS.IDENTITY) private identityClient: ClientProxy,
    @Inject(SERVICE_TOKENS.RECRUITING) private recruitingClient: ClientProxy,
    @Inject(SERVICE_TOKENS.PROFILES) private profilesClient: ClientProxy,
    @Inject(SERVICE_TOKENS.NOTIFICATION) private notificationClient: ClientProxy,
    @Inject(SERVICE_TOKENS.CV) private cvClient: ClientProxy,
    @Inject(SERVICE_TOKENS.INTERVIEW) private interviewClient: ClientProxy,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Aggregated health check of all microservices' })
  async check() {
    const services = [
      { name: 'identity', client: this.identityClient },
      { name: 'recruiting', client: this.recruitingClient },
      { name: 'profiles', client: this.profilesClient },
      { name: 'notification', client: this.notificationClient },
      { name: 'cv', client: this.cvClient },
      { name: 'interview', client: this.interviewClient },
    ];

    const results: Record<string, any> = {};
    let allHealthy = true;

    await Promise.all(
      services.map(async (service) => {
        try {
          const res = await firstValueFrom(
            service.client.send('health.check', {}).pipe(
              timeout(3000),
              catchError((err) => {
                return of({ status: 'error', error: err.message || String(err) });
              }),
            ),
          );
          results[service.name] = res;
          if (!res || res.status !== 'ok') {
            allHealthy = false;
          }
        } catch (err: any) {
          results[service.name] = { status: 'error', error: err.message || String(err) };
          allHealthy = false;
        }
      }),
    );

    const localMetrics = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    const aggregatedStatus = allHealthy ? 'ok' : 'error';

    return {
      status: aggregatedStatus,
      gateway: localMetrics,
      services: results,
    };
  }
}
