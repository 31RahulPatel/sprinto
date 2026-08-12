import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Optional password reset — blank/omitted leaves the current password unchanged.
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
