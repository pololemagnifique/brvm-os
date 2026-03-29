import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapeController } from './scrape.controller';
import { ScrapeService } from './scrape.service';
import { ScrapeLog } from './scrape-log.entity';
import { EodPrice } from '../stocks/eod-price.entity';
import { Indice } from '../stocks/indice.entity';
import { Stock } from '../stocks/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeLog, EodPrice, Indice, Stock])],
  controllers: [ScrapeController],
  providers: [ScrapeService],
  exports: [ScrapeService],
})
export class ScrapeModule {}
