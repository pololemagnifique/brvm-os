import { ScrapeService } from './scrape.service';
export declare class ScrapeController {
    private readonly scrapeService;
    constructor(scrapeService: ScrapeService);
    getStatus(): Promise<{
        ok: boolean;
        scrape: {
            status: import("./scrape-log.entity").ScrapeStatus;
            tradingDate: string;
            stocksCount: number;
            indicesCount: number;
            durationMs: number;
            error: string;
            startedAt: Date;
        } | null;
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
    runScrape(): Promise<{
        ok: boolean;
        success: boolean;
        tradingDate: string;
        stocksSaved: number;
        indicesSaved: number;
        durationMs: number;
        message: string | undefined;
        error: string | undefined;
    }>;
    debugParse(): Promise<{
        inDb: string[];
        parsed: string[];
        missing: string[];
    }>;
}
