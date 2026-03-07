import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.clerkUserId) {
      throw new ForbiddenException("User not authenticated");
    }

    // Fetch user from database
    const dbUser = await this.prisma.user.findUnique({
      where: { clerkUserId: user.clerkUserId },
    });

    if (!dbUser) {
      throw new ForbiddenException("User not found");
    }

    // Attach full user to request
    request.dbUser = dbUser;

    // Check if user has required role
    if (!requiredRoles.includes(dbUser.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
