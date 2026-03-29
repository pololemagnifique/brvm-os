import { IsString, IsNumber, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AlertType } from '../alert.entity';

export class CreateAlertDto {
  @IsUUID()
  @IsOptional()
  stockId?: string;

  @IsEnum(AlertType)
  type: AlertType;

  @IsString()
  condition: string; // 'ABOVE' | 'BELOW' | 'EQUALS'

  @IsNumber()
  threshold: number;
}
