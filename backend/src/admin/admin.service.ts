import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  UpdateDoctorStatusDto,
  UpdateDoctorActiveStatusDto,
  ApprovePayoutDto,
} from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async verifyAdmin(clerkUserId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkUserId },
      });
      return user?.role === "ADMIN";
    } catch (error) {
      console.error("Failed to verify admin:", error);
      return false;
    }
  }

  async getPendingDoctors() {
    const pendingDoctors = await this.prisma.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { doctors: pendingDoctors };
  }

  async getVerifiedDoctors() {
    const verifiedDoctors = await this.prisma.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
      orderBy: {
        name: "asc",
      },
    });
    return { doctors: verifiedDoctors };
  }

  async updateDoctorStatus(dto: UpdateDoctorStatusDto) {
    await this.prisma.user.update({
      where: { id: dto.doctorId },
      data: { verificationStatus: dto.status },
    });
    return { success: true };
  }

  async updateDoctorActiveStatus(dto: UpdateDoctorActiveStatusDto) {
    const status = dto.suspend === "true" ? "PENDING" : "VERIFIED";
    await this.prisma.user.update({
      where: { id: dto.doctorId },
      data: { verificationStatus: status },
    });
    return { success: true };
  }

  async getPendingPayouts() {
    const pendingPayouts = await this.prisma.payout.findMany({
      where: { status: "PROCESSING" },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            credits: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { payouts: pendingPayouts };
  }

  async approvePayout(dto: ApprovePayoutDto, adminClerkUserId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { clerkUserId: adminClerkUserId },
    });

    if (!admin) {
      throw new UnauthorizedException("Admin not found");
    }

    // Get the payout details
    const payout = await this.prisma.payout.findUnique({
      where: { id: dto.payoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    if (payout.status !== "PROCESSING") {
      throw new Error("Payout has already been processed");
    }

    // Process payout in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update payout status
      const updatedPayout = await tx.payout.update({
        where: { id: dto.payoutId },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: admin.id,
        },
      });

      // Deduct credits from doctor
      await tx.user.update({
        where: { id: payout.doctorId },
        data: {
          credits: {
            decrement: payout.credits,
          },
        },
      });

      return updatedPayout;
    });

    return { success: true, payout: result };
  }
}
