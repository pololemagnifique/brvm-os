"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScrapeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const eod_price_entity_1 = require("../stocks/eod-price.entity");
const indice_entity_1 = require("../stocks/indice.entity");
const stock_entity_1 = require("../stocks/stock.entity");
const scrape_log_entity_1 = require("./scrape-log.entity");
const playwright_1 = require("playwright");
let ScrapeService = ScrapeService_1 = class ScrapeService {
    eodRepo;
    indiceRepo;
    stockRepo;
    logRepo;
    logger = new common_1.Logger(ScrapeService_1.name);
    browser = null;
    scraping = false;
    constructor(eodRepo, indiceRepo, stockRepo, logRepo) {
        this.eodRepo = eodRepo;
        this.indiceRepo = indiceRepo;
        this.stockRepo = stockRepo;
        this.logRepo = logRepo;
    }
    async onModuleDestroy() {
        if (this.browser) {
            try {
                await this.browser.close();
            }
            catch { }
        }
    }
    async runScrape() {
        const start = Date.now();
        const log = await this.logRepo.save(this.logRepo.create({ status: scrape_log_entity_1.ScrapeStatus.RUNNING }));
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
            log.status = scrape_log_entity_1.ScrapeStatus.SUCCESS;
            log.tradingDate = tradingDate;
            log.stocksCount = stocksSaved;
            log.indicesCount = indicesSaved;
            log.durationMs = ms;
            await this.logRepo.save(log);
            this.logger.log(`✅ Done — ${stocksSaved} prix, ${indicesSaved} indices en ${ms}ms`);
            return { success: true, tradingDate, stocksSaved, indicesSaved, durationMs: ms };
        }
        catch (err) {
            const ms = Date.now() - start;
            this.logger.error(`❌ Error: ${err.message}`);
            log.status = scrape_log_entity_1.ScrapeStatus.FAILED;
            log.durationMs = ms;
            log.error = err.message;
            await this.logRepo.save(log);
            return { success: false, tradingDate: '', stocksSaved: 0, indicesSaved: 0, durationMs: ms, error: err.message };
        }
        finally {
            this.scraping = false;
        }
    }
    async getBrowser() {
        if (!this.browser || !this.browser.isConnected()) {
            this.browser = await playwright_1.chromium.launch({
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
    async scrapeWithPlaywright() {
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
            await page.waitForSelector('td', { timeout: 15_000 });
            this.logger.log('Table found, waiting 3s...');
            await page.waitForTimeout(3_000);
            const bodyText = await page.evaluate(() => document.body.innerText);
            const allTds = await page.$$eval('td', (tds) => tds.map((td) => {
                let raw = (td.textContent ?? '').trim();
                const span = td.querySelector('span');
                if (span) {
                    const s = (span.textContent ?? '').trim().replace('%', '').replace(',', '.');
                    const n = parseFloat(s);
                    if (!isNaN(n))
                        raw = n.toString();
                }
                return raw;
            }));
            const tradingDate = this.parseTradingDate(bodyText);
            const indices = this.parseIndices(allTds);
            const stocks = this.parseStocks(allTds);
            this.logger.log(`Parsed: ${stocks.length} stocks, ${Object.keys(indices).length} indices`);
            return { tradingDate, indices, stocks };
        }
        finally {
            await page.close().catch(() => { });
        }
    }
    parseTradingDate(bodyText) {
        const MONTH_MAP = {
            janvier: 1, january: 1, février: 2, february: 2, mars: 3, march: 3,
            avril: 4, april: 4, mai: 5, may: 5, juin: 6, june: 6,
            juillet: 7, july: 7, août: 8, august: 8,
            septembre: 9, september: 9, octobre: 10, october: 10,
            novembre: 11, november: 11, décembre: 12, december: 12,
        };
        const match = bodyText.match(/(\d{1,2})\s+([a-zA-Z]+),?\s+(\d{4})/);
        if (!match)
            return new Date().toISOString().slice(0, 10);
        const monthNum = MONTH_MAP[match[2].toLowerCase()];
        if (!monthNum)
            return new Date().toISOString().slice(0, 10);
        try {
            return new Date(parseInt(match[3]), monthNum - 1, parseInt(match[1]))
                .toISOString().slice(0, 10);
        }
        catch {
            return new Date().toISOString().slice(0, 10);
        }
    }
    parseIndices(allTds) {
        const indices = {};
        const idxMap = [
            ['BRVM-C', 'BRVM-COMP'],
            ['BRVM-30', 'BRVM-30'],
            ['BRVM-PRES', 'BRVM-PRESTIGE'],
        ];
        const found = new Set();
        for (let i = 0; i < allTds.length; i++) {
            for (const [key, name] of idxMap) {
                if (allTds[i] === key && !found.has(name)) {
                    for (let offset = 1; offset <= 4; offset++) {
                        if (i + offset >= allTds.length)
                            break;
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
    parseStocks(allTds) {
        const toFloat = (s) => parseFloat(s.replace(/[\sFCFA%]/g, '').replace(',', '.')) || 0;
        const stocks = [];
        const SKIP = new Set(['FR', 'EN', 'PO', 'BRVM-C', 'BRVM-30', 'BRVM-PRES']);
        let i = 51;
        while (i + 7 <= allTds.length) {
            const [ticker, name, volS, openS, prevS, lastS, chgS] = allTds.slice(i, i + 7);
            if (/^[A-Z]{2,6}$/.test(ticker) &&
                !SKIP.has(ticker) &&
                name.length > 2) {
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
    async upsertPrices(tradingDate, stocks) {
        if (stocks.length === 0)
            return 0;
        const tickers = stocks.map((s) => s.ticker);
        const dbStocks = await this.stockRepo.find({ where: { ticker: (0, typeorm_2.In)(tickers) } });
        const stockMap = new Map(dbStocks.map((s) => [s.ticker, s.id]));
        const ids = Array.from(stockMap.values());
        if (ids.length > 0)
            await this.eodRepo.delete({ tradingDate, stockId: (0, typeorm_2.In)(ids) });
        const entities = [];
        for (const s of stocks) {
            const stockId = stockMap.get(s.ticker);
            if (!stockId)
                continue;
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
        if (entities.length > 0)
            await this.eodRepo.insert(entities);
        return entities.length;
    }
    async upsertIndices(tradingDate, indices) {
        const INDICE_NAMES = {
            'BRVM-COMP': 'BRVM Composite',
            'BRVM-30': 'BRVM-30',
            'BRVM-PRESTIGE': 'BRVM Prestige',
        };
        await this.indiceRepo.delete({ tradingDate });
        const entities = Object.entries(indices).map(([key, data]) => ({
            indexKey: key,
            name: INDICE_NAMES[key] ?? key,
            tradingDate,
            value: data.value,
            changePct: data.change ?? undefined,
        }));
        if (entities.length > 0)
            await this.indiceRepo.insert(entities);
        return entities.length;
    }
    async getLastScrape() {
        return this.logRepo.findOne({ where: {}, order: { startedAt: 'DESC' } });
    }
    async getScrapeHistory(limit = 10) {
        return this.logRepo.find({ where: {}, order: { startedAt: 'DESC' }, take: limit });
    }
    async getAllTickersInDb() {
        const stocks = await this.stockRepo.find({ select: ['ticker'] });
        return stocks.map((s) => s.ticker);
    }
    async scrapeForDebug() {
        return this.scrapeWithPlaywright();
    }
};
exports.ScrapeService = ScrapeService;
exports.ScrapeService = ScrapeService = ScrapeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(eod_price_entity_1.EodPrice)),
    __param(1, (0, typeorm_1.InjectRepository)(indice_entity_1.Indice)),
    __param(2, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(3, (0, typeorm_1.InjectRepository)(scrape_log_entity_1.ScrapeLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ScrapeService);
//# sourceMappingURL=scrape.service.js.map