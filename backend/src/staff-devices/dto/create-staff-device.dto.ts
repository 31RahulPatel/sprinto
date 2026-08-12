import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStaffDeviceDto {
  @IsString()
  @MinLength(1)
  deviceName: string;

  @IsString()
  @MinLength(1)
  os: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  // Admin-provisioning path — omit to self-register (ownerId defaults to the caller).
  @IsOptional()
  @IsString()
  ownerId?: string;
}
