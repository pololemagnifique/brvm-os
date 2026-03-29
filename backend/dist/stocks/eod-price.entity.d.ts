import { Stock } from './stock.entity';
export declare class EodPrice {
    id: string;
    stockId: string;
    stock: Stock;
    tradingDate: string;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    closePrice: number;
    volume: number;
    previousClose: number;
    changePct: number;
    createdAt: Date;
}
