import { IsString, MinLength } from 'class-validator';

export class BitbucketCallbackDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(1)
  state: string;
}
