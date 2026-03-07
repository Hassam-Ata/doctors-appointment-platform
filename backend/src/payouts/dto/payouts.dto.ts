import { IsString, IsEmail } from "class-validator";

export class RequestPayoutDto {
  @IsEmail()
  paypalEmail: string;
}
