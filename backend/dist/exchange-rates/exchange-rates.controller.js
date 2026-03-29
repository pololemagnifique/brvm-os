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
exports.ExchangeRatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exchange_rates_service_1 = require("./exchange-rates.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ExchangeRatesController = class ExchangeRatesController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getCurrent() {
        const rate = await this.service.getTodayRate();
        if (!rate) {
            return { ok: false, message: 'Aucun taux enregistré ce jour' };
        }
        return {
            ok: true,
            rate: {
                date: rate.rateDate,
                usdToXof: rate.usdToXof,
                eurToXof: rate.eurToXof,
                usdToEur: rate.usdToEur,
                source: rate.source,
                fetchedAt: rate.fetchedAt,
            },
        };
    }
    async getHistory() {
        const rates = await this.service.getLatestRates(30);
        return {
            ok: true,
            count: rates.length,
            rates: rates.map((r) => ({
                date: r.rateDate,
                usdToXof: r.usdToXof,
                eurToXof: r.eurToXof,
                usdToEur: r.usdToEur,
                source: r.source,
            })),
        };
    }
    async refresh() {
        const rate = await this.service.saveRate();
        return {
            ok: true,
            rate: {
                date: rate.rateDate,
                usdToXof: rate.usdToXof,
                eurToXof: rate.eurToXof,
                usdToEur: rate.usdToEur,
                source: rate.source,
                fetchedAt: rate.fetchedAt,
            },
        };
    }
};
exports.ExchangeRatesController = ExchangeRatesController;
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Taux du jour (USD et EUR → XOF)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeRatesController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Historique des taux (30 derniers jours)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeRatesController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Rafraîchir les taux maintenant (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeRatesController.prototype, "refresh", null);
exports.ExchangeRatesController = ExchangeRatesController = __decorate([
    (0, swagger_1.ApiTags)('exchange-rates'),
    (0, common_1.Controller)('exchange-rates'),
    __metadata("design:paramtypes", [exchange_rates_service_1.ExchangeRatesService])
], ExchangeRatesController);
//# sourceMappingURL=exchange-rates.controller.js.map