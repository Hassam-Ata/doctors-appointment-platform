import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  /**
   * This would be called from a webhook or scheduled job
   * to allocate credits based on subscription
   */
  async allocateSubscriptionCredits(clerkUserId: string, plan: string) {
    const PLAN_CREDITS = {
      free_user: 0,
      standard: 10,
      premium: 24,
    };

    const creditsToAllocate = PLAN_CREDITS[plan] || 0;

    if (creditsToAllocate === 0) {
      return { success: false, message: "No credits to allocate" };
    }

    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user || user.role !== "PATIENT") {
      return { success: false, message: "User not found or not a patient" };
    }

    // Check if already allocated this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const existingTransaction = await this.prisma.creditTransaction.findFirst({
      where: {
        userId: user.id,
        type: "CREDIT_PURCHASE",
        packageId: plan,
        createdAt: {
          gte: currentMonth,
        },
      },
    });

    if (existingTransaction) {
      return {
        success: false,
        message: "Credits already allocated this month",
      };
    }

    // Allocate credits
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditsToAllocate,
          type: "CREDIT_PURCHASE",
          packageId: plan,
        },
      });

      return tx.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: creditsToAllocate,
          },
        },
      });
    });

    return { success: true, user: updatedUser };
  }
}
