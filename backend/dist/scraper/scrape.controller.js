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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const scrape_service_1 = require("./scrape.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ScrapeController = class ScrapeController {
    scrapeService;
    constructor(scrapeService) {
        this.scrapeService = scrapeService;
    }
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
    async debugParse() {
        const dbTickers = await this.scrapeService.getAllTickersInDb();
        const { stocks } = await this.scrapeService.scrapeForDebug();
        const parsedTickers = stocks.map((s) => s.ticker);
        const missing = parsedTickers.filter((t) => !dbTickers.includes(t));
        return { inDb: dbTickers, parsed: parsedTickers, missing };
    }
};
exports.ScrapeController = ScrapeController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Dernier scrape' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Historique des 10 derniers scrapes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Déclencher un scrape BRVM' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "runScrape", null);
__decorate([
    (0, common_1.Get)('debug-parse'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '[Debug] Comparer tickers parsés vs base' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "debugParse", null);
exports.ScrapeController = ScrapeController = __decorate([
    (0, swagger_1.ApiTags)('admin / scraping'),
    (0, common_1.Controller)('admin/scrape'),
    __metadata("design:paramtypes", [scrape_service_1.ScrapeService])
], ScrapeController);
//# sourceMappingURL=scrape.controller.js.map