import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { HealthModule } from './modules/health/health.module';
import { GoogleCalendarModule } from './modules/google-calendar/google-calendar.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    DepartmentsModule,
    GoogleCalendarModule,
    HealthModule,
  ],
})
export class IdentityModule {}
