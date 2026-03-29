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
exports.PortfoliosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const portfolio_entity_1 = require("./portfolio.entity");
const transaction_entity_1 = require("./transaction.entity");
const watchlist_entity_1 = require("./watchlist.entity");
const watchlist_item_entity_1 = require("./watchlist-item.entity");
let PortfoliosService = class PortfoliosService {
    portfolioRepo;
    txRepo;
    watchlistRepo;
    watchlistItemRepo;
    constructor(portfolioRepo, txRepo, watchlistRepo, watchlistItemRepo) {
        this.portfolioRepo = portfolioRepo;
        this.txRepo = txRepo;
        this.watchlistRepo = watchlistRepo;
        this.watchlistItemRepo = watchlistItemRepo;
    }
    async getPortfolios(userId) {
        return this.portfolioRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    }
    async createPortfolio(userId, dto) {
        const portfolio = this.portfolioRepo.create({ ...dto, userId });
        return this.portfolioRepo.save(portfolio);
    }
    async getTransactions(portfolioId, userId) {
        const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
        if (!portfolio)
            throw new common_1.NotFoundException('Portefeuille non trouvé');
        if (portfolio.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.txRepo.find({
            where: { portfolioId },
            relations: ['stock'],
            order: { transactionDate: 'DESC' },
        });
    }
    async addTransaction(portfolioId, userId, dto) {
        const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
        if (!portfolio)
            throw new common_1.NotFoundException('Portefeuille non trouvé');
        if (portfolio.userId !== userId)
            throw new common_1.ForbiddenException();
        const tx = this.txRepo.create({ ...dto, portfolioId });
        return this.txRepo.save(tx);
    }
    async getPositions(portfolioId, userId) {
        const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
        if (!portfolio)
            throw new common_1.NotFoundException('Portefeuille non trouvé');
        if (portfolio.userId !== userId)
            throw new common_1.ForbiddenException();
        const txs = await this.txRepo.find({
            where: { portfolioId },
            relations: ['stock'],
            order: { transactionDate: 'ASC' },
        });
        const positions = new Map();
        for (const tx of txs) {
            const key = tx.stockId;
            const pos = positions.get(key) || { stock: tx.stock, quantity: 0, totalCost: 0, avgCost: 0 };
            if (tx.type === transaction_entity_1.TransactionType.BUY) {
                pos.totalCost += tx.quantity * tx.price + (tx.fees || 0);
                pos.quantity += tx.quantity;
            }
            else {
                pos.totalCost -= (tx.quantity / (pos.quantity + tx.quantity)) * pos.totalCost;
                pos.quantity -= tx.quantity;
            }
            pos.avgCost = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
            positions.set(key, pos);
        }
        return Array.from(positions.values())
            .filter((p) => p.quantity > 0)
            .map((p) => ({
            ...p.stock,
            quantity: p.quantity,
            totalCost: Math.round(p.totalCost * 100) / 100,
            avgCost: Math.round(p.avgCost * 100) / 100,
        }));
    }
    async getWatchlists(userId) {
        return this.watchlistRepo.find({
            where: { userId },
            relations: ['items', 'items.stock'],
            order: { createdAt: 'DESC' },
        });
    }
    async createWatchlist(userId, name) {
        const wl = this.watchlistRepo.create({ name, userId });
        return this.watchlistRepo.save(wl);
    }
    async addToWatchlist(watchlistId, userId, dto) {
        const wl = await this.watchlistRepo.findOne({ where: { id: watchlistId } });
        if (!wl || wl.userId !== userId)
            throw new common_1.ForbiddenException('Watchlist non accessible');
        const item = this.watchlistItemRepo.create({ watchlistId, stockId: dto.stockId });
        return this.watchlistItemRepo.save(item);
    }
    async removeFromWatchlist(watchlistId, userId, stockId) {
        const wl = await this.watchlistRepo.findOne({ where: { id: watchlistId } });
        if (!wl || wl.userId !== userId)
            throw new common_1.ForbiddenException();
        await this.watchlistItemRepo.delete({ watchlistId, stockId });
        return { deleted: true };
    }
};
exports.PortfoliosService = PortfoliosService;
exports.PortfoliosService = PortfoliosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(portfolio_entity_1.Portfolio)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(watchlist_entity_1.Watchlist)),
    __param(3, (0, typeorm_1.InjectRepository)(watchlist_item_entity_1.WatchlistItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PortfoliosService);
//# sourceMappingURL=portfolios.service.js.map