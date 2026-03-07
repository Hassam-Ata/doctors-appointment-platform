import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestPayoutDto } from "./dto/payouts.dto";

const CREDIT_VALUE = 10; // $10 per credit total
const PLATFORM_FEE_PER_CREDIT = 2; // $2 platform fee
const DOCTOR_EARNINGS_PER_CREDIT = 8; // $8 to doctor

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async requestPayout(dto: RequestPayoutDto, clerkUserId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new UnauthorizedException("Doctor not found");
    }

    // Check for existing pending payout
    const existingPendingPayout = await this.prisma.payout.findFirst({
      where: {
        doctorId: doctor.id,
        status: "PROCESSING",
      },
    });

    if (existingPendingPayout) {
      throw new BadRequestException(
        "You already have a pending payout request. Please wait for it to be processed.",
      );
    }

    const creditCount = doctor.credits;

    if (creditCount === 0) {
      throw new BadRequestException("No credits available for payout");
    }

    if (creditCount < 1) {
      throw new BadRequestException("Minimum 1 credit required for payout");
    }

    const totalAmount = creditCount * CREDIT_VALUE;
    const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
    const netAmount = creditCount * DOCTOR_EARNINGS_PER_CREDIT;

    const payout = await this.prisma.payout.create({
      data: {
        doctorId: doctor.id,
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
        paypalEmail: dto.paypalEmail,
        status: "PROCESSING",
      },
    });

    return { success: true, payout };
  }

  async getDoctorPayouts(clerkUserId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new UnauthorizedException("Doctor not found");
    }

    const payouts = await this.prisma.payout.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: "desc" },
    });

    return { payouts };
  }
}
