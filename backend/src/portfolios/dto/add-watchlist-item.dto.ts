import { IsUUID } from 'class-validator';

export class AddWatchlistItemDto {
  @IsUUID()
  stockId: string;
}
