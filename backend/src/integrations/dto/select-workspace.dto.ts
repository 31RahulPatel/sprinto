import { IsString, MinLength } from 'class-validator';

export class SelectWorkspaceDto {
  @IsString()
  @MinLength(1)
  workspaceSlug: string;

  @IsString()
  @MinLength(1)
  workspaceName: string;
}
