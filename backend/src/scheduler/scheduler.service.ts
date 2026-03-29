import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { ScrapeService } from '../scraper/scrape.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly scrapeService: ScrapeService) {}

  onModuleInit() {
    // Exécuter chaque jour à 18h30 (heure d'Abidjan = UTC, pas de décalage été)
    // cron expr: seconde minute heure jour mois jour_semaine
    // 18:30 tous les jours = "0 30 18 * * *"
    cron.schedule('0 30 18 * * *', async () => {
      this.logger.log('⏰ [CRON] Lancement du scrape BRVM quotidien...');
      try {
        const result = await this.scrapeService.runScrape();
        if (result.success) {
          this.logger.log(
            `✅ [CRON] Scrape réussi — ${result.stocksSaved} actions, ${result.indicesSaved} indices — ${result.durationMs}ms`,
          );
        } else {
          this.logger.error(`❌ [CRON] Scrape échoué: ${result.error}`);
        }
      } catch (err: any) {
        this.logger.error(`❌ [CRON] Exception: ${err.message}`);
      }
    });

    this.logger.log('📅 Scheduler initialisé — scrape quotidien à 18h30');
  }
}
