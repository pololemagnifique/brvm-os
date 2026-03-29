import { TransactionType } from '../transaction.entity';
export declare class CreateTransactionDto {
    stockId: string;
    type: TransactionType;
    quantity: number;
    price: number;
    fees?: number;
    transactionDate: string;
    notes?: string;
}
