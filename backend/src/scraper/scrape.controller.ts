import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ScrapeService } from './scrape.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin / scraping')
@Controller('admin/scrape')
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déclencher un scrape BRVM immédiat' })
  async triggerScrape() {
    const result = await this.scrapeService.runScrape();
    return {
      ok: result.success,
      ...result,
      message: result.success
        ? `Scrape réussi — ${result.stocksSaved} actions, ${result.indicesSaved} indices`
        : `Scrape échoué: ${result.error}`,
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Statut du dernier scrape' })
  async getStatus() {
    const last = await this.scrapeService.getLastScrape();
    if (!last) return { ok: true, status: 'no_scrape_yet' };
    return {
      ok: true,
      status: last.status,
      tradingDate: last.tradingDate,
      stocksCount: last.stocksCount,
      indicesCount: last.indicesCount,
      durationMs: last.durationMs,
      error: last.error,
      startedAt: last.startedAt,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des 10 derniers scrapes' })
  async getHistory() {
    const history = await this.scrapeService.getScrapeHistory(10);
    return {
      ok: true,
      count: history.length,
      history: history.map((h) => ({
        status: h.status,
        tradingDate: h.tradingDate,
        stocksCount: h.stocksCount,
        indicesCount: h.indicesCount,
        durationMs: h.durationMs,
        error: h.error,
        startedAt: h.startedAt,
      })),
    };
  }
}
