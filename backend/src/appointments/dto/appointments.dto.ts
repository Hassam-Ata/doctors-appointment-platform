import { IsString, IsDateString, IsOptional } from "class-validator";

export class BookAppointmentDto {
  @IsString()
  doctorId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GenerateVideoTokenDto {
  @IsString()
  appointmentId: string;
}

export class CancelAppointmentDto {
  @IsString()
  appointmentId: string;
}

export class CompleteAppointmentDto {
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
