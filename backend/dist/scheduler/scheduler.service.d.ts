import { OnModuleInit } from '@nestjs/common';
import { ScrapeService } from '../scraper/scrape.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
export declare class SchedulerService implements OnModuleInit {
    private readonly scrapeService;
    private readonly exchangeRatesService;
    private readonly logger;
    constructor(scrapeService: ScrapeService, exchangeRatesService: ExchangeRatesService);
    onModuleInit(): void;
}
