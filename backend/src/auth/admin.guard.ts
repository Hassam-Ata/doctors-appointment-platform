import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface RequestWithUser {
  user: {
    role: string;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (user?.role !== 'ADMIN') throw new ForbiddenException('Admins only');
    return true;
  }
}
