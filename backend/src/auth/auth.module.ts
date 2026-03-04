import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk.guard.js';
import { AdminGuard } from './admin.guard.js';

@Module({
  providers: [ClerkAuthGuard, AdminGuard],
  exports: [ClerkAuthGuard, AdminGuard],
})
export class AuthModule {}
