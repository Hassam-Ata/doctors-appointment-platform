import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SetUserRoleDto, CreateUserDto } from "./dto/users.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getCurrentUser(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });
    return user;
  }

  async setUserRole(dto: SetUserRoleDto, clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found in database");
    }

    if (dto.role === "PATIENT") {
      await this.prisma.user.update({
        where: { clerkUserId },
        data: { role: "PATIENT" },
      });
      return { success: true, redirect: "/doctors" };
    }

    if (dto.role === "DOCTOR") {
      if (
        !dto.specialty ||
        !dto.experience ||
        !dto.credentialUrl ||
        !dto.description
      ) {
        throw new BadRequestException("All doctor fields are required");
      }

      await this.prisma.user.update({
        where: { clerkUserId },
        data: {
          role: "DOCTOR",
          specialty: dto.specialty,
          experience: dto.experience,
          credentialUrl: dto.credentialUrl,
          description: dto.description,
          verificationStatus: "PENDING",
        },
      });
      return { success: true, redirect: "/doctor/verification" };
    }

    throw new BadRequestException("Invalid role");
  }

  async createOrUpdateUser(clerkUserId: string, dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (existingUser) {
      return existingUser;
    }

    const newUser = await this.prisma.user.create({
      data: {
        clerkUserId,
        email: dto.email,
        name: dto.name,
        imageUrl: dto.imageUrl,
        role: "UNASSIGNED",
      },
    });

    return newUser;
  }

  async upsertUserFromClerkWebhook(payload: any) {
    const clerkUserId = payload?.id;
    if (!clerkUserId) {
      throw new BadRequestException("Missing Clerk user id in webhook payload");
    }

    const email = this.extractPrimaryEmail(payload) || this.buildFallbackEmail(clerkUserId);

    const firstName = payload?.first_name?.trim?.() || "";
    const lastName = payload?.last_name?.trim?.() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const name = fullName || payload?.username || null;

    return this.prisma.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        email,
        name,
        imageUrl: payload?.image_url || null,
      },
      update: {
        email,
        name,
        imageUrl: payload?.image_url || null,
      },
    });
  }

  async deleteUserFromClerkWebhook(payload: any) {
    const clerkUserId = payload?.id;
    if (!clerkUserId) {
      throw new BadRequestException("Missing Clerk user id in webhook payload");
    }

    const result = await this.prisma.user.deleteMany({
      where: { clerkUserId },
    });

    if (result.count === 0) {
      this.logger.log(
        `Received user.deleted for non-existing user: ${clerkUserId}`,
      );
    }

    return { deleted: result.count > 0 };
  }

  private extractPrimaryEmail(payload: any): string | null {
    const emailAddresses = payload?.email_addresses;

    if (!Array.isArray(emailAddresses) || emailAddresses.length === 0) {
      return null;
    }

    const primaryEmailId = payload?.primary_email_address_id;
    const primary = emailAddresses.find(
      (email: any) => email?.id === primaryEmailId,
    );

    return (
      primary?.email_address ||
      emailAddresses[0]?.email_address ||
      emailAddresses[0]?.emailAddress ||
      null
    );
  }

  private buildFallbackEmail(clerkUserId: string): string {
    return `${clerkUserId}@users.clerk.local`;
  }
}
