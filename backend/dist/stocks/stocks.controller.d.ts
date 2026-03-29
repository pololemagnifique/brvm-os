import { StocksService } from './stocks.service';
export declare class StocksController {
    private stocksService;
    constructor(stocksService: StocksService);
    findAll(search?: string): Promise<import("./stock.entity").Stock[]>;
    getLatestPrices(ticker?: string): Promise<import("./eod-price.entity").EodPrice[]>;
    getIndices(): Promise<import("./indice.entity").Indice[]>;
    findOne(ticker: string): Promise<import("./stock.entity").Stock>;
    getHistory(ticker: string, days?: string): Promise<import("./eod-price.entity").EodPrice[]>;
}
