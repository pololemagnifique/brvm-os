import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EodPrice } from '../stocks/eod-price.entity';
import { Indice } from '../stocks/indice.entity';
import { Stock } from '../stocks/stock.entity';
import { ScrapeLog, ScrapeStatus } from './scrape-log.entity';
import { chromium, Browser, Page } from 'playwright';

interface StockData {
  ticker: string;
  company: string;
  volume: number;
  open: number;
  prevClose: number;
  last: number;
  changePct: number;
}

@Injectable()
export class ScrapeService implements OnModuleDestroy {
  private readonly logger = new Logger(ScrapeService.name);
  private browser: Browser | null = null;
  private scraping = false;

  constructor(
    @InjectRepository(EodPrice)
    private eodRepo: Repository<EodPrice>,
    @InjectRepository(Indice)
    private indiceRepo: Repository<Indice>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(ScrapeLog)
    private logRepo: Repository<ScrapeLog>,
  ) {}

  async onModuleDestroy() {
    if (this.browser) {
      try { await this.browser.close(); } catch { /* ignore */ }
    }
  }

  // ─── Scrape ─────────────────────────────────────────────────────────────

  async runScrape(): Promise<{
    success: boolean;
    tradingDate: string;
    stocksSaved: number;
    indicesSaved: number;
    durationMs: number;
    error?: string;
  }> {
    const start = Date.now();
    const log = await this.logRepo.save(
      this.logRepo.create({ status: ScrapeStatus.RUNNING }),
    );

    try {
      if (this.scraping) {
        return { success: false, tradingDate: '', stocksSaved: 0, indicesSaved: 0, durationMs: 0, error: 'Scrape already in progress' };
      }
      this.scraping = true;
      this.logger.log('🚀 Scraping BRVM...');
      const { tradingDate, indices, stocks } = await this.scrapeWithPlaywright();

      this.logger.log(`📊 ${stocks.length} actions, ${Object.keys(indices).length} indices — ${tradingDate}`);

      const [stocksSaved, indicesSaved] = await Promise.all([
        this.upsertPrices(tradingDate, stocks),
        this.upsertIndices(tradingDate, indices),
      ]);

      const ms = Date.now() - start;
      log.status = ScrapeStatus.SUCCESS;
      log.tradingDate = tradingDate;
      log.stocksCount = stocksSaved;
      log.indicesCount = indicesSaved;
      log.durationMs = ms;
      await this.logRepo.save(log);

      this.logger.log(`✅ Done — ${stocksSaved} prix, ${indicesSaved} indices en ${ms}ms`);
      return { success: true, tradingDate, stocksSaved, indicesSaved, durationMs: ms };
    } catch (err: any) {
      const ms = Date.now() - start;
      this.logger.error(`❌ Error: ${err.message}`);
      log.status = ScrapeStatus.FAILED;
      log.durationMs = ms;
      log.error = err.message;
      await this.logRepo.save(log);
      return { success: false, tradingDate: '', stocksSaved: 0, indicesSaved: 0, durationMs: ms, error: err.message };
    } finally {
      this.scraping = false;
    }
  }

  // ─── Playwright ─────────────────────────────────────────────────────────

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
        ],
      });
    }
    return this.browser;
  }

  private async scrapeWithPlaywright(): Promise<{
    tradingDate: string;
    indices: Record<string, { value: number; change: number }>;
    stocks: StockData[];
  }> {
    const browser = await this.getBrowser();
    this.logger.log('Browser acquired, creating page...');
    const page = await browser.newPage();
    this.logger.log('Page created');

    try {
      this.logger.log('Navigating to brvm.org...');
      await page.setExtraHTTPHeaders({ Accept: 'text/html,application/xhtml+xml' });
      await page.goto('https://www.brvm.org/fr/cours-actions/0', {
        waitUntil: 'domcontentloaded',
        timeout: 40_000,
      });
      this.logger.log('Page DOM loaded, waiting for table...');
      // Attendre que la table soit visible
      await page.waitForSelector('td', { timeout: 15_000 });
      this.logger.log('Table found, waiting 3s...');
      await page.waitForTimeout(3_000);

      // Extraire le body text d'abord (pour la date)
      const bodyText = await page.evaluate(() => document.body.innerText);

      // Extraire tous les TD
      const allTds: string[] = await page.$$eval('td', (tds) =>
        tds.map((td) => {
          let raw = (td.textContent ?? '').trim();
          const span = td.querySelector('span');
          if (span) {
            const s = (span.textContent ?? '').trim().replace('%', '').replace(',', '.');
            const n = parseFloat(s);
            if (!isNaN(n)) raw = n.toString();
          }
          return raw;
        }),
      );

      // Parser la date
      const tradingDate = this.parseTradingDate(bodyText);

      // Parser les indices et les actions
      const indices = this.parseIndices(allTds);
      const stocks = this.parseStocks(allTds);

      this.logger.log(`Parsed: ${stocks.length} stocks, ${Object.keys(indices).length} indices`);

      return { tradingDate, indices, stocks };
    } finally {
      await page.close().catch(() => {/* ignore */});
    }
  }

  private parseTradingDate(bodyText: string): string {
    const MONTH_MAP: Record<string, number> = {
      janvier:1, january:1, février:2, february:2, mars:3, march:3,
      avril:4, april:4, mai:5, may:5, juin:6, june:6,
      juillet:7, july:7, août:8, august:8,
      septembre:9, september:9, octobre:10, october:10,
      novembre:11, november:11, décembre:12, december:12,
    };
    const match = bodyText.match(/(\d{1,2})\s+([a-zA-Z]+),?\s+(\d{4})/);
    if (!match) return new Date().toISOString().slice(0, 10);
    const monthNum = MONTH_MAP[match[2].toLowerCase()];
    if (!monthNum) return new Date().toISOString().slice(0, 10);
    try {
      return new Date(parseInt(match[3]), monthNum - 1, parseInt(match[1]))
        .toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  private parseIndices(
    allTds: string[],
  ): Record<string, { value: number; change: number }> {
    const indices: Record<string, { value: number; change: number }> = {};
    const idxMap = [
      ['BRVM-C', 'BRVM-COMP'],
      ['BRVM-30', 'BRVM-30'],
      ['BRVM-PRES', 'BRVM-PRESTIGE'],
    ];
    const found = new Set<string>();
    for (let i = 0; i < allTds.length; i++) {
      for (const [key, name] of idxMap) {
        if (allTds[i] === key && !found.has(name)) {
          for (let offset = 1; offset <= 4; offset++) {
            if (i + offset >= allTds.length) break;
            const val = parseFloat(allTds[i + offset].replace(',', '.').trim());
            if (!isNaN(val)) {
              indices[name] = { value: val, change: 0 };
              found.add(name);
              break;
            }
          }
        }
      }
    }
    return indices;
  }

  private parseStocks(allTds: string[]): StockData[] {
    const toFloat = (s: string) =>
      parseFloat(s.replace(/[\sFCFA%]/g, '').replace(',', '.')) || 0;
    const stocks: StockData[] = [];
    const SKIP = new Set(['FR', 'EN', 'PO', 'BRVM-C', 'BRVM-30', 'BRVM-PRES']);
    let i = 51;
    while (i + 7 <= allTds.length) {
      const [ticker, name, volS, openS, prevS, lastS, chgS] = allTds.slice(i, i + 7);
      if (
        /^[A-Z]{2,6}$/.test(ticker) &&
        !SKIP.has(ticker) &&
        name.length > 2
      ) {
        stocks.push({
          ticker,
          company: name.trim(),
          volume: Math.round(toFloat(volS)),
          open: toFloat(openS),
          prevClose: toFloat(prevS),
          last: toFloat(lastS),
          changePct: parseFloat(chgS.replace('%', '').replace(',', '.')) || 0,
        });
      }
      i += 7;
    }
    return stocks;
  }

  // ─── DB write ────────────────────────────────────────────────────────────

  private async upsertPrices(tradingDate: string, stocks: StockData[]): Promise<number> {
    if (stocks.length === 0) return 0;
    const tickers = stocks.map((s) => s.ticker);
    const dbStocks = await this.stockRepo.find({ where: { ticker: In(tickers) } });
    const stockMap = new Map(dbStocks.map((s) => [s.ticker, s.id]));

    const ids = Array.from(stockMap.values());
    if (ids.length > 0) await this.eodRepo.delete({ tradingDate, stockId: In(ids) });

    const entities: Partial<EodPrice>[] = [];
    for (const s of stocks) {
      const stockId = stockMap.get(s.ticker);
      if (!stockId) continue;
      entities.push({
        stockId,
        tradingDate,
        openPrice: s.open || undefined,
        highPrice: undefined,
        lowPrice: undefined,
        closePrice: s.last,
        volume: s.volume,
        previousClose: s.prevClose || undefined,
        changePct: s.changePct || undefined,
      });
    }
    if (entities.length > 0) await this.eodRepo.insert(entities as EodPrice[]);
    return entities.length;
  }

  private async upsertIndices(
    tradingDate: string,
    indices: Record<string, { value: number; change: number }>,
  ): Promise<number> {
    const INDICE_NAMES: Record<string, string> = {
      'BRVM-COMP': 'BRVM Composite',
      'BRVM-30': 'BRVM-30',
      'BRVM-PRESTIGE': 'BRVM Prestige',
    };
    await this.indiceRepo.delete({ tradingDate });
    const entities: Partial<Indice>[] = Object.entries(indices).map(([key, data]) => ({
      indexKey: key,
      name: INDICE_NAMES[key] ?? key,
      tradingDate,
      value: data.value,
      changePct: data.change ?? undefined,
    }));
    if (entities.length > 0) await this.indiceRepo.insert(entities as Indice[]);
    return entities.length;
  }

  // ─── Query ───────────────────────────────────────────────────────────────

  async getLastScrape(): Promise<ScrapeLog | null> {
    return this.logRepo.findOne({ where: {}, order: { startedAt: 'DESC' } });
  }

  async getScrapeHistory(limit = 10): Promise<ScrapeLog[]> {
    return this.logRepo.find({ where: {}, order: { startedAt: 'DESC' }, take: limit });
  }
}
