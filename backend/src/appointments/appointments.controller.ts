import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { ClerkAuthGuard } from "../common/guards/clerk-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
  BookAppointmentDto,
  GenerateVideoTokenDto,
  CancelAppointmentDto,
  CompleteAppointmentDto,
} from "./dto/appointments.dto";

@Controller("appointments")
@UseGuards(ClerkAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post("book")
  async bookAppointment(
    @Body() dto: BookAppointmentDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.appointmentsService.bookAppointment(dto, user.clerkUserId);
  }

  @Post("video-token")
  async generateVideoToken(
    @Body() dto: GenerateVideoTokenDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.appointmentsService.generateVideoToken(dto, user.clerkUserId);
  }

  @Get("patient")
  async getPatientAppointments(@CurrentUser() user: { clerkUserId: string }) {
    return this.appointmentsService.getPatientAppointments(user.clerkUserId);
  }

  @Post("cancel")
  async cancelAppointment(
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.appointmentsService.cancelAppointment(dto, user.clerkUserId);
  }

  @Post("complete")
  async completeAppointment(
    @Body() dto: CompleteAppointmentDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.appointmentsService.completeAppointment(dto, user.clerkUserId);
  }
}
