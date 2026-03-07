import { IsString, IsDateString } from "class-validator";

export class SetAvailabilityDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
