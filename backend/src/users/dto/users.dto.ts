import { IsString, IsIn, IsInt, IsOptional, Min } from "class-validator";

export class SetUserRoleDto {
  @IsString()
  @IsIn(["PATIENT", "DOCTOR"])
  role: "PATIENT" | "DOCTOR";

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @IsOptional()
  @IsString()
  credentialUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateUserDto {
  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
