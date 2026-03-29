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
exports.StocksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_entity_1 = require("./stock.entity");
const eod_price_entity_1 = require("./eod-price.entity");
const indice_entity_1 = require("./indice.entity");
let StocksService = class StocksService {
    stocksRepo;
    pricesRepo;
    indicesRepo;
    constructor(stocksRepo, pricesRepo, indicesRepo) {
        this.stocksRepo = stocksRepo;
        this.pricesRepo = pricesRepo;
        this.indicesRepo = indicesRepo;
    }
    findAll(search) {
        const qb = this.stocksRepo.createQueryBuilder('stock')
            .where('stock.is_active = :active', { active: true })
            .orderBy('stock.ticker', 'ASC');
        if (search) {
            qb.andWhere('(LOWER(stock.ticker) LIKE LOWER(:q) OR LOWER(stock.company_name) LIKE LOWER(:q))', { q: `%${search}%` });
        }
        return qb.getMany();
    }
    async findOne(ticker) {
        const stock = await this.stocksRepo.findOne({ where: { ticker, isActive: true } });
        if (!stock)
            throw new common_1.NotFoundException(`Titre ${ticker} non trouvé`);
        return stock;
    }
    async getLatestPrices(ticker) {
        const qb = this.pricesRepo
            .createQueryBuilder('price')
            .innerJoinAndSelect('price.stock', 'stock')
            .orderBy('price.trading_date', 'DESC')
            .limit(100);
        if (ticker) {
            qb.andWhere('stock.ticker = :ticker', { ticker });
        }
        const prices = await qb.getMany();
        const latest = new Map();
        for (const p of prices) {
            if (!latest.has(p.stock.ticker))
                latest.set(p.stock.ticker, p);
        }
        return Array.from(latest.values());
    }
    async getHistory(ticker, days = 30) {
        const stock = await this.stocksRepo.findOne({ where: { ticker } });
        if (!stock)
            throw new common_1.NotFoundException(`Titre ${ticker} non trouvé`);
        const from = new Date();
        from.setDate(from.getDate() - days);
        return this.pricesRepo.find({
            where: { stockId: stock.id, tradingDate: (0, typeorm_2.Between)(from.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)) },
            order: { tradingDate: 'ASC' },
        });
    }
    async getIndices() {
        const latest = await this.indicesRepo
            .createQueryBuilder('idx')
            .orderBy('idx.trading_date', 'DESC')
            .getOne();
        if (!latest)
            return [];
        return this.indicesRepo.find({ where: { tradingDate: latest.tradingDate } });
    }
};
exports.StocksService = StocksService;
exports.StocksService = StocksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(1, (0, typeorm_1.InjectRepository)(eod_price_entity_1.EodPrice)),
    __param(2, (0, typeorm_1.InjectRepository)(indice_entity_1.Indice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StocksService);
//# sourceMappingURL=stocks.service.js.map