import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { DatabaseService } from '../database/database.service.js';

interface RequestWithUser {
  headers: {
    authorization?: string;
  };
  user: Record<string, unknown>;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const user = await this.db.user.findUnique({
        where: { clerkUserId: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User not found');

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
