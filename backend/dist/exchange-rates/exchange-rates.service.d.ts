import { Repository } from 'typeorm';
import { ExchangeRate } from './exchange-rate.entity';
export declare class ExchangeRatesService {
    private readonly rateRepo;
    private readonly logger;
    private readonly BCEAO_PEG;
    constructor(rateRepo: Repository<ExchangeRate>);
    fetchRates(): Promise<{
        usdToXof: number;
        eurToXof: number;
        usdToEur: number;
        source: string;
    }>;
    private fetchXeCom;
    private fetchFrankfurterUsdToEur;
    saveRate(): Promise<ExchangeRate>;
    getTodayRate(): Promise<ExchangeRate | null>;
    getLatestRates(limit?: number): Promise<ExchangeRate[]>;
}
