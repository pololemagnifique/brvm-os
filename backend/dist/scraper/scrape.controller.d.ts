import { ScrapeService } from './scrape.service';
export declare class ScrapeController {
    private readonly scrapeService;
    constructor(scrapeService: ScrapeService);
    triggerScrape(): Promise<{
        message: string;
        success: boolean;
        tradingDate: string;
        stocksSaved: number;
        indicesSaved: number;
        durationMs: number;
        error?: string;
        ok: boolean;
    }>;
    getStatus(): Promise<{
        ok: boolean;
        status: string;
        tradingDate?: undefined;
        stocksCount?: undefined;
        indicesCount?: undefined;
        durationMs?: undefined;
        error?: undefined;
        startedAt?: undefined;
    } | {
        ok: boolean;
        status: import("./scrape-log.entity").ScrapeStatus;
        tradingDate: string;
        stocksCount: number;
        indicesCount: number;
        durationMs: number;
        error: string;
        startedAt: Date;
    }>;
    getHistory(): Promise<{
        ok: boolean;
        count: number;
        history: {
            status: import("./scrape-log.entity").ScrapeStatus;
            tradingDate: string;
            stocksCount: number;
            indicesCount: number;
            durationMs: number;
            error: string;
            startedAt: Date;
        }[];
    }>;
}
