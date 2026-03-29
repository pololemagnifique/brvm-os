import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @IsString()
  stockId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  fees?: number;

  @IsString()
  transactionDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
