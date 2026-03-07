import { Controller, Get, Post, Body, UseGuards, Param } from "@nestjs/common";
import { DoctorsService } from "./doctors.service";
import { ClerkAuthGuard } from "../common/guards/clerk-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { SetAvailabilityDto } from "./dto/doctors.dto";

@Controller("doctors")
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get("specialty/:specialty")
  async getDoctorsBySpecialty(@Param("specialty") specialty: string) {
    return this.doctorsService.getDoctorsBySpecialty(specialty);
  }

  @Post("availability")
  @UseGuards(ClerkAuthGuard)
  async setAvailability(
    @Body() dto: SetAvailabilityDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.doctorsService.setAvailability(dto, user.clerkUserId);
  }

  @Get("availability")
  @UseGuards(ClerkAuthGuard)
  async getDoctorAvailability(@CurrentUser() user: { clerkUserId: string }) {
    return this.doctorsService.getDoctorAvailability(user.clerkUserId);
  }

  @Get("appointments")
  @UseGuards(ClerkAuthGuard)
  async getDoctorAppointments(@CurrentUser() user: { clerkUserId: string }) {
    return this.doctorsService.getDoctorAppointments(user.clerkUserId);
  }

  @Get("earnings")
  @UseGuards(ClerkAuthGuard)
  async getDoctorEarnings(@CurrentUser() user: { clerkUserId: string }) {
    return this.doctorsService.getDoctorEarnings(user.clerkUserId);
  }
}
