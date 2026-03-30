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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksController = void 0;
const common_1 = require("@nestjs/common");
const stocks_service_1 = require("./stocks.service");
let StocksController = class StocksController {
    stocksService;
    constructor(stocksService) {
        this.stocksService = stocksService;
    }
    findAll(search) {
        return this.stocksService.findAll(search);
    }
    getLatestPrices(ticker) {
        return this.stocksService.getLatestPrices(ticker);
    }
    getIndices() {
        return this.stocksService.getIndices();
    }
    findOne(ticker) {
        return this.stocksService.findOne(ticker);
    }
    getHistory(ticker, days) {
        return this.stocksService.getHistory(ticker, days ? parseInt(days) : 30);
    }
    getTechnicals(ticker) {
        return this.stocksService.getTechnicals(ticker);
    }
};
exports.StocksController = StocksController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('prices'),
    __param(0, (0, common_1.Query)('ticker')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getLatestPrices", null);
__decorate([
    (0, common_1.Get)('indices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getIndices", null);
__decorate([
    (0, common_1.Get)(':ticker'),
    __param(0, (0, common_1.Param)('ticker')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':ticker/history'),
    __param(0, (0, common_1.Param)('ticker')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':ticker/technicals'),
    __param(0, (0, common_1.Param)('ticker')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StocksController.prototype, "getTechnicals", null);
exports.StocksController = StocksController = __decorate([
    (0, common_1.Controller)('stocks'),
    __metadata("design:paramtypes", [stocks_service_1.StocksService])
], StocksController);
//# sourceMappingURL=stocks.controller.js.map