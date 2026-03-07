import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { PayoutsService } from "./payouts.service";
import { ClerkAuthGuard } from "../common/guards/clerk-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequestPayoutDto } from "./dto/payouts.dto";

@Controller("payouts")
@UseGuards(ClerkAuthGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post("request")
  async requestPayout(
    @Body() dto: RequestPayoutDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.payoutsService.requestPayout(dto, user.clerkUserId);
  }

  @Get()
  async getDoctorPayouts(@CurrentUser() user: { clerkUserId: string }) {
    return this.payoutsService.getDoctorPayouts(user.clerkUserId);
  }
}
