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
exports.ScrapeLog = exports.ScrapeStatus = void 0;
const typeorm_1 = require("typeorm");
var ScrapeStatus;
(function (ScrapeStatus) {
    ScrapeStatus["RUNNING"] = "running";
    ScrapeStatus["SUCCESS"] = "success";
    ScrapeStatus["FAILED"] = "failed";
})(ScrapeStatus || (exports.ScrapeStatus = ScrapeStatus = {}));
let ScrapeLog = class ScrapeLog {
    id;
    status;
    tradingDate;
    stocksCount;
    indicesCount;
    error;
    durationMs;
    startedAt;
};
exports.ScrapeLog = ScrapeLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScrapeLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: ScrapeStatus.RUNNING }),
    __metadata("design:type", String)
], ScrapeLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trading_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], ScrapeLog.prototype, "tradingDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stocks_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ScrapeLog.prototype, "stocksCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'indices_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ScrapeLog.prototype, "indicesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ScrapeLog.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_ms', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ScrapeLog.prototype, "durationMs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'started_at' }),
    __metadata("design:type", Date)
], ScrapeLog.prototype, "startedAt", void 0);
exports.ScrapeLog = ScrapeLog = __decorate([
    (0, typeorm_1.Entity)('scrape_logs')
], ScrapeLog);
//# sourceMappingURL=scrape-log.entity.js.map