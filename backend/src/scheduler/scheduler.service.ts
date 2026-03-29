import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { ScrapeService } from '../scraper/scrape.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly scrapeService: ScrapeService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  onModuleInit() {
    // Taux de change à 18h00 chaque jour
    cron.schedule('0 0 18 * * *', async () => {
      this.logger.log('⏰ [CRON] Taux de change...');
      try {
        const rate = await this.exchangeRatesService.saveRate();
        this.logger.log(
          `✅ [CRON] Taux: 1 USD = ${rate.usdToXof} XOF | 1 EUR = ${rate.eurToXof} XOF [${rate.source}]`,
        );
      } catch (err: any) {
        this.logger.error(`❌ [CRON] Taux échoué: ${err.message}`);
      }
    });

    // Scrape BRVM à 18h30 chaque jour
    cron.schedule('0 30 18 * * *', async () => {
      this.logger.log('⏰ [CRON] Scrape BRVM...');
      try {
        const result = await this.scrapeService.runScrape();
        if (result.success) {
          this.logger.log(
            `✅ [CRON] Scrape: ${result.stocksSaved} actions, ${result.indicesSaved} indices — ${result.durationMs}ms`,
          );
        } else {
          this.logger.error(`❌ [CRON] Scrape: ${result.error}`);
        }
      } catch (err: any) {
        this.logger.error(`❌ [CRON] Exception: ${err.message}`);
      }
    });

    this.logger.log('📅 Scheduler: taux @18h00 + scrape BRVM @18h30');
  }
}
