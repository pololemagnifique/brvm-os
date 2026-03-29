import { Portfolio } from './portfolio.entity';
import { Stock } from '../stocks/stock.entity';
export declare enum TransactionType {
    BUY = "BUY",
    SELL = "SELL"
}
export declare class Transaction {
    id: string;
    portfolioId: string;
    portfolio: Portfolio;
    stockId: string;
    stock: Stock;
    type: TransactionType;
    quantity: number;
    price: number;
    fees: number;
    transactionDate: string;
    notes: string;
    createdAt: Date;
}
