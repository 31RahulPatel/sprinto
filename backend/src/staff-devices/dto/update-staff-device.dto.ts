import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateStaffDeviceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  os?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  controlId?: string;
}
