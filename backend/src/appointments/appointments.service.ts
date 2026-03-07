import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  BookAppointmentDto,
  GenerateVideoTokenDto,
  CancelAppointmentDto,
  CompleteAppointmentDto,
} from "./dto/appointments.dto";
import { Vonage } from "@vonage/server-sdk";
import { Auth } from "@vonage/auth";

@Injectable()
export class AppointmentsService {
  private vonage: Vonage;

  constructor(private prisma: PrismaService) {
    // Initialize Vonage Video API client
    const credentials = new Auth({
      applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
      privateKey: process.env.VONAGE_PRIVATE_KEY,
    });
    this.vonage = new Vonage(credentials, {});
  }

  async bookAppointment(dto: BookAppointmentDto, clerkUserId: string) {
    // Get the patient user
    const patient = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "PATIENT" },
    });

    if (!patient) {
      throw new BadRequestException("Patient not found");
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Check if the doctor exists and is verified
    const doctor = await this.prisma.user.findUnique({
      where: {
        id: dto.doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new BadRequestException("Doctor not found or not verified");
    }

    // Check if the patient has enough credits
    if (patient.credits < 2) {
      throw new BadRequestException(
        "Insufficient credits to book an appointment",
      );
    }

    // Check for overlapping appointments
    const overlappingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        status: "SCHEDULED",
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    });

    if (overlappingAppointment) {
      throw new BadRequestException("This time slot is already booked");
    }

    // Create video session
    const sessionId = await this.createVideoSession();

    // Deduct credits and create appointment in transaction
    const appointment = await this.prisma.$transaction(async (tx) => {
      // Create transaction for patient (deduction)
      await tx.creditTransaction.create({
        data: {
          userId: patient.id,
          amount: -2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Create transaction for doctor (addition)
      await tx.creditTransaction.create({
        data: {
          userId: doctor.id,
          amount: 2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Update patient credits
      await tx.user.update({
        where: { id: patient.id },
        data: { credits: { decrement: 2 } },
      });

      // Update doctor credits
      await tx.user.update({
        where: { id: doctor.id },
        data: { credits: { increment: 2 } },
      });

      // Create appointment
      return tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          startTime,
          endTime,
          patientDescription: dto.description,
          status: "SCHEDULED",
          videoSessionId: sessionId,
        },
      });
    });

    return { success: true, appointment };
  }

  private async createVideoSession(): Promise<string> {
    try {
      const session = await this.vonage.video.createSession({});
      return session.sessionId;
    } catch (error) {
      throw new Error("Failed to create video session: " + error.message);
    }
  }

  async generateVideoToken(dto: GenerateVideoTokenDto, clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new BadRequestException("Appointment not found");
    }

    // Verify the user is part of this appointment
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new UnauthorizedException(
        "You are not authorized to join this call",
      );
    }

    if (!appointment.videoSessionId) {
      throw new BadRequestException(
        "No video session associated with this appointment",
      );
    }

    // Generate token
    try {
      const token = this.vonage.video.generateClientToken(
        appointment.videoSessionId,
        {
          role: "publisher",
          data: `userId=${user.id}`,
          expireTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        },
      );

      return { success: true, token, sessionId: appointment.videoSessionId };
    } catch (error) {
      throw new Error("Failed to generate video token: " + error.message);
    }
  }

  async getPatientAppointments(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "PATIENT" },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException("Patient not found");
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { patientId: user.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return { appointments };
  }

  async cancelAppointment(dto: CancelAppointmentDto, clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment) {
      throw new BadRequestException("Appointment not found");
    }

    // Verify user is part of this appointment
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new UnauthorizedException(
        "Not authorized to cancel this appointment",
      );
    }

    if (appointment.status !== "SCHEDULED") {
      throw new BadRequestException(
        "Only scheduled appointments can be cancelled",
      );
    }

    // Refund credits in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Refund patient
      await tx.creditTransaction.create({
        data: {
          userId: appointment.patient.id,
          amount: 2,
          type: "ADMIN_ADJUSTMENT",
        },
      });

      await tx.user.update({
        where: { id: appointment.patient.id },
        data: { credits: { increment: 2 } },
      });

      // Deduct from doctor
      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctor.id,
          amount: -2,
          type: "ADMIN_ADJUSTMENT",
        },
      });

      await tx.user.update({
        where: { id: appointment.doctor.id },
        data: { credits: { decrement: 2 } },
      });

      // Update appointment status
      return tx.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: "CANCELLED" },
      });
    });

    return { success: true, appointment: result };
  }

  async completeAppointment(dto: CompleteAppointmentDto, clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId, role: "DOCTOR" },
    });

    if (!user) {
      throw new UnauthorizedException("Only doctors can complete appointments");
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new BadRequestException("Appointment not found");
    }

    if (appointment.doctorId !== user.id) {
      throw new UnauthorizedException(
        "Not authorized to complete this appointment",
      );
    }

    if (appointment.status !== "SCHEDULED") {
      throw new BadRequestException(
        "Only scheduled appointments can be completed",
      );
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: dto.appointmentId },
      data: {
        status: "COMPLETED",
        notes: dto.notes,
      },
    });

    return { success: true, appointment: updatedAppointment };
  }
}
