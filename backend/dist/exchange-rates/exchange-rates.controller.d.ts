import { ExchangeRatesService } from './exchange-rates.service';
export declare class ExchangeRatesController {
    private readonly service;
    constructor(service: ExchangeRatesService);
    getCurrent(): Promise<{
        ok: boolean;
        message: string;
        rate?: undefined;
    } | {
        ok: boolean;
        rate: {
            date: string;
            usdToXof: number;
            eurToXof: number;
            usdToEur: number | null;
            source: string;
            fetchedAt: Date;
        };
        message?: undefined;
    }>;
    getHistory(): Promise<{
        ok: boolean;
        count: number;
        rates: {
            date: string;
            usdToXof: number;
            eurToXof: number;
            usdToEur: number | null;
            source: string;
        }[];
    }>;
    refresh(): Promise<{
        ok: boolean;
        rate: {
            date: string;
            usdToXof: number;
            eurToXof: number;
            usdToEur: number | null;
            source: string;
            fetchedAt: Date;
        };
    }>;
}
