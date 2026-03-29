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
exports.ExchangeRate = void 0;
const typeorm_1 = require("typeorm");
let ExchangeRate = class ExchangeRate {
    id;
    rateDate;
    source;
    usdToXof;
    eurToXof;
    usdToEur;
    fetchedAt;
};
exports.ExchangeRate = ExchangeRate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExchangeRate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'rate_date' }),
    __metadata("design:type", String)
], ExchangeRate.prototype, "rateDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ExchangeRate.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'usd_to_xof' }),
    __metadata("design:type", Number)
], ExchangeRate.prototype, "usdToXof", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'eur_to_xof' }),
    __metadata("design:type", Number)
], ExchangeRate.prototype, "eurToXof", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'usd_to_eur', nullable: true }),
    __metadata("design:type", Object)
], ExchangeRate.prototype, "usdToEur", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fetched_at' }),
    __metadata("design:type", Date)
], ExchangeRate.prototype, "fetchedAt", void 0);
exports.ExchangeRate = ExchangeRate = __decorate([
    (0, typeorm_1.Entity)('exchange_rates')
], ExchangeRate);
//# sourceMappingURL=exchange-rate.entity.js.map