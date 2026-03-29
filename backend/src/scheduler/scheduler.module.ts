import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScrapeModule } from '../scraper/scrape.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';

@Module({
  imports: [ScheduleModule.forRoot(), ScrapeModule, ExchangeRatesModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
