import { Repository } from 'typeorm';
import { Stock } from './stock.entity';
import { EodPrice } from './eod-price.entity';
import { Indice } from './indice.entity';
export declare class StocksService {
    private stocksRepo;
    private pricesRepo;
    private indicesRepo;
    constructor(stocksRepo: Repository<Stock>, pricesRepo: Repository<EodPrice>, indicesRepo: Repository<Indice>);
    findAll(search?: string): Promise<Stock[]>;
    findOne(ticker: string): Promise<Stock>;
    getLatestPrices(ticker?: string): Promise<EodPrice[]>;
    getHistory(ticker: string, days?: number): Promise<EodPrice[]>;
    getIndices(): Promise<Indice[]>;
}
