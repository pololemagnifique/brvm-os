import { IsString, IsOptional } from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  isDefault?: boolean;
}
