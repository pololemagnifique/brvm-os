import { OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EodPrice } from '../stocks/eod-price.entity';
import { Indice } from '../stocks/indice.entity';
import { Stock } from '../stocks/stock.entity';
import { ScrapeLog } from './scrape-log.entity';
interface StockData {
    ticker: string;
    company: string;
    volume: number;
    open: number;
    prevClose: number;
    last: number;
    changePct: number;
}
export declare class ScrapeService implements OnModuleDestroy {
    private eodRepo;
    private indiceRepo;
    private stockRepo;
    private logRepo;
    private readonly logger;
    private browser;
    private scraping;
    constructor(eodRepo: Repository<EodPrice>, indiceRepo: Repository<Indice>, stockRepo: Repository<Stock>, logRepo: Repository<ScrapeLog>);
    onModuleDestroy(): Promise<void>;
    runScrape(): Promise<{
        success: boolean;
        tradingDate: string;
        stocksSaved: number;
        indicesSaved: number;
        durationMs: number;
        error?: string;
    }>;
    private getBrowser;
    private scrapeWithPlaywright;
    private parseTradingDate;
    private parseIndices;
    private parseStocks;
    private upsertPrices;
    private upsertIndices;
    getLastScrape(): Promise<ScrapeLog | null>;
    getScrapeHistory(limit?: number): Promise<ScrapeLog[]>;
    getAllTickersInDb(): Promise<string[]>;
    scrapeForDebug(): Promise<{
        tradingDate: string;
        indices: Record<string, {
            value: number;
            change: number;
        }>;
        stocks: StockData[];
    }>;
}
export {};
