import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SetAvailabilityDto } from "./dto/doctors.dto";

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async getDoctorsBySpecialty(specialty: string) {
    const doctors = await this.prisma.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
        specialty: specialty.split("%20").join(" "),
      },
      orderBy: { name: "asc" },
    });
    return { doctors };
  }

  async setAvailability(dto: SetAvailabilityDto, clerkUserId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new UnauthorizedException("Doctor not found");
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException("Start time must be before end time");
    }

    // Get existing slots
    const existingSlots = await this.prisma.availability.findMany({
      where: { doctorId: doctor.id },
    });

    // Delete slots without appointments
    if (existingSlots.length > 0) {
      await this.prisma.availability.deleteMany({
        where: {
          doctorId: doctor.id,
          status: "AVAILABLE",
        },
      });
    }

    // Create new slot
    const newSlot = await this.prisma.availability.create({
      data: {
        doctorId: doctor.id,
        startTime,
        endTime,
        status: "AVAILABLE",
      },
    });

    return { success: true, slot: newSlot };
  }

  async getDoctorAvailability(clerkUserId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new UnauthorizedException("Doctor not found");
    }

    const availabilitySlots = await this.prisma.availability.findMany({
      where: { doctorId: doctor.id },
      orderBy: { startTime: "asc" },
    });

    return { slots: availabilitySlots };
  }

  async getDoctorAppointments(clerkUserId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new UnauthorizedException("Doctor not found");
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ["SCHEDULED"] },
      },
      include: { patient: true },
      orderBy: { startTime: "asc" },
    });

    return { appointments };
  }

  async getDoctorEarnings(clerkUserId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!doctor) {
      throw new UnauthorizedException("Doctor not found");
    }

    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
      },
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (appointment) => new Date(appointment.createdAt) >= currentMonth,
    );

    const DOCTOR_EARNINGS_PER_CREDIT = 8;
    const totalEarnings = doctor.credits * DOCTOR_EARNINGS_PER_CREDIT;
    const thisMonthEarnings =
      thisMonthAppointments.length * 2 * DOCTOR_EARNINGS_PER_CREDIT;
    const averageEarningsPerMonth =
      totalEarnings > 0
        ? totalEarnings / Math.max(1, new Date().getMonth() + 1)
        : 0;

    const availableCredits = doctor.credits;
    const availablePayout = availableCredits * DOCTOR_EARNINGS_PER_CREDIT;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
      },
    };
  }
}
