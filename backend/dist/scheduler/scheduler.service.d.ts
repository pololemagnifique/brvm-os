import { OnModuleInit } from '@nestjs/common';
import { ScrapeService } from '../scraper/scrape.service';
export declare class SchedulerService implements OnModuleInit {
    private readonly scrapeService;
    private readonly logger;
    constructor(scrapeService: ScrapeService);
    onModuleInit(): void;
}
