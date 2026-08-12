import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CloudAccountsModule } from './cloud-accounts/cloud-accounts.module';
import { ScansModule } from './scans/scans.module';
import { FindingsModule } from './findings/findings.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ControlsModule } from './controls/controls.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActivityModule } from './activity/activity.module';
import { TasksModule } from './tasks/tasks.module';
import { VulnerabilitiesModule } from './vulnerabilities/vulnerabilities.module';
import { PeopleModule } from './people/people.module';
import { StaffDevicesModule } from './staff-devices/staff-devices.module';
import { PoliciesModule } from './policies/policies.module';
import { TrainingsModule } from './trainings/trainings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>('REDIS_URL'));
        return { connection: { host: url.hostname, port: Number(url.port) } };
      },
    }),
    PrismaModule,
    StorageModule,
    ActivityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CloudAccountsModule,
    ScansModule,
    FindingsModule,
    IntegrationsModule,
    ControlsModule,
    SettingsModule,
    DashboardModule,
    TasksModule,
    VulnerabilitiesModule,
    PeopleModule,
    StaffDevicesModule,
    PoliciesModule,
    TrainingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
