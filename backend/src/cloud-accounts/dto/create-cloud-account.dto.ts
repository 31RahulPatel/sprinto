import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCloudAccountDto {
  @IsString()
  @MinLength(1)
  accountId: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  @MinLength(1)
  region: string;

  @IsString()
  @MinLength(1)
  roleArn: string;

  @IsString()
  @MinLength(1)
  externalId: string;
}
