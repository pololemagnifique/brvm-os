export declare enum ScrapeStatus {
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed"
}
export declare class ScrapeLog {
    id: string;
    status: ScrapeStatus;
    tradingDate: string;
    stocksCount: number;
    indicesCount: number;
    error: string;
    durationMs: number;
    startedAt: Date;
}
