import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AddWatchlistItemDto {
  @IsString()
  ticker: string;
}

export class CreateWatchlistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString({ each: true })
  tickers?: string[];
}

export class UpdateWatchlistDto {
  @IsString()
  name: string;
}
