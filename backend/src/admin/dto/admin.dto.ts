import { IsString, IsIn } from "class-validator";

export class UpdateDoctorStatusDto {
  @IsString()
  doctorId: string;

  @IsIn(["VERIFIED", "REJECTED", "PENDING"])
  status: "VERIFIED" | "REJECTED" | "PENDING";
}

export class UpdateDoctorActiveStatusDto {
  @IsString()
  doctorId: string;

  @IsString()
  @IsIn(["true", "false"])
  suspend: string;
}

export class ApprovePayoutDto {
  @IsString()
  payoutId: string;
}
