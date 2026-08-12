import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateScanDto {
  @IsString()
  @MinLength(1)
  cloudAccountId: string;

  @IsOptional()
  @IsIn(['s3', 'iam', 'rds', 'vpc', 'lambda', 'cloudtrail'])
  service?: 's3' | 'iam' | 'rds' | 'vpc' | 'lambda' | 'cloudtrail';
}
