import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { ClerkAuthGuard } from "../common/guards/clerk-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
  UpdateDoctorStatusDto,
  UpdateDoctorActiveStatusDto,
  ApprovePayoutDto,
} from "./dto/admin.dto";

@Controller("admin")
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("doctors/pending")
  async getPendingDoctors() {
    return this.adminService.getPendingDoctors();
  }

  @Get("doctors/verified")
  async getVerifiedDoctors() {
    return this.adminService.getVerifiedDoctors();
  }

  @Post("doctors/update-status")
  async updateDoctorStatus(@Body() dto: UpdateDoctorStatusDto) {
    return this.adminService.updateDoctorStatus(dto);
  }

  @Post("doctors/update-active-status")
  async updateDoctorActiveStatus(@Body() dto: UpdateDoctorActiveStatusDto) {
    return this.adminService.updateDoctorActiveStatus(dto);
  }

  @Get("payouts/pending")
  async getPendingPayouts() {
    return this.adminService.getPendingPayouts();
  }

  @Post("payouts/approve")
  async approvePayout(
    @Body() dto: ApprovePayoutDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.adminService.approvePayout(dto, user.clerkUserId);
  }
}
