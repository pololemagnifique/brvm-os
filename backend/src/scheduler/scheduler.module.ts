import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScrapeModule } from '../scraper/scrape.module';

@Module({
  imports: [ScheduleModule.forRoot(), ScrapeModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
