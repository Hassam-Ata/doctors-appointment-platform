import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SetUserRoleDto, CreateUserDto } from "./dto/users.dto";

@Injectable()
export class UsersService {
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
}
