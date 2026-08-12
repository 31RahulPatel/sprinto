import { IsBoolean } from 'class-validator';

export class ToggleRepoSelectionDto {
  @IsBoolean()
  selected: boolean;
}
