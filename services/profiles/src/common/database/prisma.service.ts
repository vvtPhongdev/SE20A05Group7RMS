import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { getAccelerateClientOptions, PrismaClient } from '@wr/database';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(getAccelerateClientOptions());
    return this.$extends(withAccelerate()) as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
