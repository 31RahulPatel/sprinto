import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateTrainingDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsUrl()
  resourceUrl?: string;
}
