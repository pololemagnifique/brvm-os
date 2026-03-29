import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScrapeService } from './scrape.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin / scraping')
@Controller('admin/scrape')
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dernier scrape' })
  async getStatus() {
    const last = await this.scrapeService.getLastScrape();
    return {
      ok: true,
      scrape: last
        ? {
            status: last.status,
            tradingDate: last.tradingDate,
            stocksCount: last.stocksCount,
            indicesCount: last.indicesCount,
            durationMs: last.durationMs,
            error: last.error,
            startedAt: last.startedAt,
          }
        : null,
    };
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Déclencher un scrape BRVM' })
  async runScrape() {
    const result = await this.scrapeService.runScrape();
    return {
      ok: result.success,
      success: result.success,
      tradingDate: result.tradingDate,
      stocksSaved: result.stocksSaved,
      indicesSaved: result.indicesSaved,
      durationMs: result.durationMs,
      message: result.success
        ? `Scrape réussi — ${result.stocksSaved} actions, ${result.indicesSaved} indices`
        : undefined,
      error: result.success ? undefined : result.error,
    };
  }

  @Get('debug-parse')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Debug] Comparer tickers parsés vs base' })
  async debugParse() {
    const dbTickers = await this.scrapeService.getAllTickersInDb();
    const { stocks } = await this.scrapeService.scrapeForDebug();
    const parsedTickers = stocks.map((s) => s.ticker);
    const missing = parsedTickers.filter((t) => !dbTickers.includes(t));
    return { inDb: dbTickers, parsed: parsedTickers, missing };
  }
}
