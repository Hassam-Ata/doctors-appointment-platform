import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { CreditsService } from "./credits.service";
import { ClerkAuthGuard } from "../common/guards/clerk-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("credits")
@UseGuards(ClerkAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post("allocate")
  async allocateCredits(
    @Body() body: { plan: string },
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.creditsService.allocateSubscriptionCredits(
      user.clerkUserId,
      body.plan,
    );
  }
}
