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
exports.EodPrice = void 0;
const typeorm_1 = require("typeorm");
const stock_entity_1 = require("./stock.entity");
let EodPrice = class EodPrice {
    id;
    stockId;
    stock;
    tradingDate;
    openPrice;
    highPrice;
    lowPrice;
    closePrice;
    volume;
    previousClose;
    changePct;
    createdAt;
};
exports.EodPrice = EodPrice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EodPrice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stock_id' }),
    __metadata("design:type", String)
], EodPrice.prototype, "stockId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => stock_entity_1.Stock),
    (0, typeorm_1.JoinColumn)({ name: 'stock_id' }),
    __metadata("design:type", stock_entity_1.Stock)
], EodPrice.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trading_date', type: 'date' }),
    __metadata("design:type", String)
], EodPrice.prototype, "tradingDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'open_price', type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], EodPrice.prototype, "openPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'high_price', type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], EodPrice.prototype, "highPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'low_price', type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], EodPrice.prototype, "lowPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'close_price', type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], EodPrice.prototype, "closePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], EodPrice.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'previous_close', type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], EodPrice.prototype, "previousClose", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'change_pct', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], EodPrice.prototype, "changePct", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], EodPrice.prototype, "createdAt", void 0);
exports.EodPrice = EodPrice = __decorate([
    (0, typeorm_1.Entity)('eod_prices')
], EodPrice);
//# sourceMappingURL=eod-price.entity.js.map