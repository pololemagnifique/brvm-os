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
    async getStatus() {
        const last = await this.scrapeService.getLastScrape();
        if (!last)
            return { ok: true, status: 'no_scrape_yet' };
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
};
exports.ScrapeController = ScrapeController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Déclencher un scrape BRVM immédiat' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "triggerScrape", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Statut du dernier scrape' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Historique des 10 derniers scrapes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapeController.prototype, "getHistory", null);
exports.ScrapeController = ScrapeController = __decorate([
    (0, swagger_1.ApiTags)('admin / scraping'),
    (0, common_1.Controller)('admin/scrape'),
    __metadata("design:paramtypes", [scrape_service_1.ScrapeService])
], ScrapeController);
//# sourceMappingURL=scrape.controller.js.map