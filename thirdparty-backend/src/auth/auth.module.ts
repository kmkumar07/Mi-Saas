import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { PermissionCheckerService } from './permission-checker.service';
import { UsageEntitlementsService } from './usage-entitlements.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PermissionCheckerService,
    UsageEntitlementsService,
  ],
  exports: [
    JwtAuthGuard,
    PermissionsGuard,
    PermissionCheckerService,
    UsageEntitlementsService,
  ],
})
export class AuthModule {}


