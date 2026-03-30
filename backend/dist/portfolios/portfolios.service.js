"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const portfolio_entity_1 = require("./portfolio.entity");
const transaction_entity_1 = require("./transaction.entity");
const watchlist_entity_1 = require("./watchlist.entity");
const watchlist_item_entity_1 = require("./watchlist-item.entity");
const stock_entity_1 = require("../stocks/stock.entity");
let PortfoliosService = class PortfoliosService {
    portfolioRepo;
    txRepo;
    watchlistRepo;
    watchlistItemRepo;
    stockRepo;
    constructor(portfolioRepo, txRepo, watchlistRepo, watchlistItemRepo, stockRepo) {
        this.portfolioRepo = portfolioRepo;
        this.txRepo = txRepo;
        this.watchlistRepo = watchlistRepo;
        this.watchlistItemRepo = watchlistItemRepo;
        this.stockRepo = stockRepo;
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
    async deleteTransaction(portfolioId, transactionId, userId) {
        const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
        if (!portfolio)
            throw new common_1.NotFoundException('Portefeuille non trouvé');
        if (portfolio.userId !== userId)
            throw new common_1.ForbiddenException();
        const tx = await this.txRepo.findOne({ where: { id: transactionId, portfolioId } });
        if (!tx)
            throw new common_1.NotFoundException('Transaction non trouvée');
        await this.txRepo.remove(tx);
        return { deleted: true, id: transactionId };
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
                const qty = Number(tx.quantity) || 0;
                const px = Number(tx.price) || 0;
                const fee = Number(tx.fees) || 0;
                pos.totalCost += qty * px + fee;
                pos.quantity += qty;
            }
            else {
                const qty = Number(tx.quantity) || 0;
                const ratio = pos.quantity > 0 ? Math.min(qty / pos.quantity, 1) : 0;
                pos.totalCost -= ratio * pos.totalCost + (Number(tx.fees) || 0);
                pos.quantity -= qty;
            }
            pos.avgCost = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
            positions.set(key, pos);
        }
        return Array.from(positions.values())
            .filter(p => p.quantity > 0)
            .map(p => ({
            ...p.stock,
            quantity: Math.round(p.quantity * 100) / 100,
            totalCost: Math.round(p.totalCost * 100) / 100,
            avgCost: Math.round(p.avgCost * 100) / 100,
        }));
    }
    async getSummary(portfolioId, userId) {
        const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
        if (!portfolio)
            throw new common_1.NotFoundException('Portefeuille non trouvé');
        if (portfolio.userId !== userId)
            throw new common_1.ForbiddenException();
        const transactions = await this.txRepo.find({
            where: { portfolioId },
            relations: ['stock'],
            order: { transactionDate: 'ASC' },
        });
        const priceFile = '/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json';
        let currentPrices = new Map();
        try {
            const eod = JSON.parse(fs.readFileSync(priceFile, 'utf-8'));
            for (const s of eod.stocks || [])
                currentPrices.set(s.ticker, s);
        }
        catch { }
        const histFile = '/data/.openclaw/workspace/brvm-os/dashboard/data/history/all_prices.json';
        let historical = {};
        try {
            historical = JSON.parse(fs.readFileSync(histFile, 'utf-8'));
        }
        catch { }
        const positions = new Map();
        for (const tx of transactions) {
            const ticker = tx.stock?.ticker;
            if (!ticker)
                continue;
            const key = ticker;
            const pos = positions.get(key) || { stock: tx.stock, quantity: 0, totalCost: 0, avgCost: 0 };
            if (tx.type === transaction_entity_1.TransactionType.BUY) {
                const qty = Number(tx.quantity) || 0;
                const px = Number(tx.price) || 0;
                const fee = Number(tx.fees) || 0;
                pos.totalCost += qty * px + fee;
                pos.quantity += qty;
            }
            else {
                const qty = Number(tx.quantity) || 0;
                if (pos.quantity > 0) {
                    const ratio = Math.min(qty / pos.quantity, 1);
                    pos.totalCost -= ratio * pos.totalCost;
                    pos.quantity -= qty;
                }
            }
            pos.avgCost = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
            positions.set(key, pos);
        }
        const fmtDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
        const today = new Date();
        const getAvailableDate = (daysBack) => {
            const target = new Date(today);
            target.setDate(target.getDate() - daysBack);
            const targetStr = fmtDate(target);
            const dates = Object.keys(historical).sort();
            for (let i = dates.length - 1; i >= 0; i--) {
                if (dates[i] <= targetStr)
                    return dates[i];
            }
            return null;
        };
        let totalInvested = 0;
        let totalMarketValue = 0;
        const enrichedPositions = [];
        for (const [ticker, pos] of positions) {
            if (pos.quantity <= 0)
                continue;
            const stockData = currentPrices.get(ticker) || {};
            const lastPrice = stockData.last ?? pos.avgCost;
            const marketValue = pos.quantity * lastPrice;
            const unrealizedPnl = marketValue - pos.totalCost;
            const unrealizedPnlPct = pos.totalCost > 0 ? (unrealizedPnl / pos.totalCost) * 100 : 0;
            const date7 = getAvailableDate(7);
            const date30 = getAvailableDate(30);
            const price7d = date7 ? (historical[date7]?.[ticker] ?? null) : null;
            const price30d = date30 ? (historical[date30]?.[ticker] ?? null) : null;
            const pnl7dPct = price7d && price7d > 0 ? ((lastPrice - price7d) / price7d) * 100 : null;
            const pnl30dPct = price30d && price30d > 0 ? ((lastPrice - price30d) / price30d) * 100 : null;
            enrichedPositions.push({
                ticker,
                companyName: pos.stock?.companyName || ticker,
                quantity: Math.round(pos.quantity * 100) / 100,
                avgCost: Math.round(pos.avgCost * 100) / 100,
                totalCost: Math.round(pos.totalCost * 100) / 100,
                lastPrice: Math.round(lastPrice * 100) / 100,
                marketValue: Math.round(marketValue * 100) / 100,
                unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
                unrealizedPnlPct: Math.round(unrealizedPnlPct * 100) / 100,
                var_7d_pct: pnl7dPct !== null ? Math.round(pnl7dPct * 100) / 100 : null,
                var_30d_pct: pnl30dPct !== null ? Math.round(pnl30dPct * 100) / 100 : null,
            });
            totalInvested += pos.totalCost;
            totalMarketValue += marketValue;
        }
        const totalUnrealizedPnl = totalMarketValue - totalInvested;
        const totalPnlPct = totalInvested > 0 ? (totalUnrealizedPnl / totalInvested) * 100 : 0;
        return {
            portfolio,
            totalInvested: Math.round(totalInvested * 100) / 100,
            totalMarketValue: Math.round(totalMarketValue * 100) / 100,
            totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
            totalPnlPct: Math.round(totalPnlPct * 100) / 100,
            positions: enrichedPositions,
            transactionsCount: transactions.length,
            updatedAt: new Date().toISOString(),
        };
    }
    async exportCsv(portfolioId, userId) {
        const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
        if (!portfolio)
            throw new common_1.NotFoundException('Portefeuille non trouvé');
        if (portfolio.userId !== userId)
            throw new common_1.ForbiddenException();
        const transactions = await this.txRepo.find({
            where: { portfolioId },
            relations: ['stock'],
            order: { transactionDate: 'ASC' },
        });
        const header = 'Date,Ticker,Entreprise,Type,Quantite,Prix unitaire,Frais,Cout total';
        const rows = transactions.map(tx => {
            const qty = Number(tx.quantity) || 0;
            const px = Number(tx.price) || 0;
            const fee = Number(tx.fees) || 0;
            const total = tx.type === transaction_entity_1.TransactionType.BUY ? qty * px + fee : -(qty * px) + fee;
            const date = new Date(tx.transactionDate).toLocaleDateString('fr-FR');
            const company = (tx.stock?.companyName || '').replace(/,/g, ';');
            return `${date},${tx.stock?.ticker || ''},${company},${tx.type},${qty},${px.toFixed(2)},${fee.toFixed(2)},${total.toFixed(2)}`;
        });
        return [header, ...rows].join('\n');
    }
    async getWatchlists(userId) {
        return this.watchlistRepo.find({
            where: { userId },
            relations: ['items', 'items.stock'],
            order: { createdAt: 'DESC' },
        });
    }
    async getWatchlist(watchlistId, userId) {
        const wl = await this.watchlistRepo.findOne({ where: { id: watchlistId }, relations: ['items', 'items.stock'] });
        if (!wl)
            throw new common_1.NotFoundException('Watchlist non trouvee');
        if (wl.userId !== userId)
            throw new common_1.ForbiddenException('Watchlist non accessible');
        return wl;
    }
    async createWatchlist(userId, dto) {
        const wl = this.watchlistRepo.create({ name: dto.name, userId });
        const saved = await this.watchlistRepo.save(wl);
        if (dto.tickers && dto.tickers.length > 0) {
            for (const ticker of dto.tickers) {
                const stock = await this.stockRepo.findOne({ where: { ticker } });
                if (stock) {
                    const item = this.watchlistItemRepo.create({ watchlistId: saved.id, stockId: stock.id });
                    await this.watchlistItemRepo.save(item);
                }
            }
        }
        return this.getWatchlist(saved.id, userId);
    }
    async updateWatchlist(watchlistId, userId, dto) {
        const wl = await this.getWatchlist(watchlistId, userId);
        wl.name = dto.name;
        return this.watchlistRepo.save(wl);
    }
    async deleteWatchlist(watchlistId, userId) {
        const wl = await this.getWatchlist(watchlistId, userId);
        await this.watchlistRepo.remove(wl);
        return { deleted: true };
    }
    async addToWatchlist(watchlistId, userId, dto) {
        await this.getWatchlist(watchlistId, userId);
        const stock = await this.stockRepo.findOne({ where: { ticker: dto.ticker } });
        if (!stock)
            throw new common_1.NotFoundException(`Ticker "${dto.ticker}" non trouve`);
        const existing = await this.watchlistItemRepo.findOne({ where: { watchlistId, stockId: stock.id } });
        if (existing)
            return existing;
        const item = this.watchlistItemRepo.create({ watchlistId, stockId: stock.id });
        return this.watchlistItemRepo.save(item);
    }
    async removeFromWatchlist(watchlistId, userId, ticker) {
        await this.getWatchlist(watchlistId, userId);
        const stock = await this.stockRepo.findOne({ where: { ticker } });
        if (!stock)
            throw new common_1.NotFoundException(`Ticker "${ticker}" non trouve`);
        await this.watchlistItemRepo.delete({ watchlistId, stockId: stock.id });
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
    __param(4, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PortfoliosService);
//# sourceMappingURL=portfolios.service.js.map