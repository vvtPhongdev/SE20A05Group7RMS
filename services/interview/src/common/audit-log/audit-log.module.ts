import { Module } from '@nestjs/common';
import { AuditLogService } from '@wr/database';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: AuditLogService,
      useFactory: (prisma: PrismaService) => new AuditLogService(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
