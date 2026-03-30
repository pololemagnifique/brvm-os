import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Portfolio } from './portfolio.entity';
import { Transaction, TransactionType } from './transaction.entity';
import { Watchlist } from './watchlist.entity';
import { WatchlistItem } from './watchlist-item.entity';
import { Stock } from '../stocks/stock.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddWatchlistItemDto, CreateWatchlistDto, UpdateWatchlistDto } from './dto/add-watchlist-item.dto';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Watchlist) private watchlistRepo: Repository<Watchlist>,
    @InjectRepository(WatchlistItem) private watchlistItemRepo: Repository<WatchlistItem>,
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
  ) {}

  // PORTFOLIOS
  async getPortfolios(userId: string) {
    return this.portfolioRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    const portfolio = this.portfolioRepo.create({ ...dto, userId });
    return this.portfolioRepo.save(portfolio);
  }

  // TRANSACTIONS
  async getTransactions(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();
    return this.txRepo.find({
      where: { portfolioId },
      relations: ['stock'],
      order: { transactionDate: 'DESC' },
    });
  }

  async addTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto) {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();
    const tx = this.txRepo.create({ ...dto, portfolioId });
    return this.txRepo.save(tx);
  }

  async deleteTransaction(portfolioId: string, transactionId: string, userId: string) {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();
    const tx = await this.txRepo.findOne({ where: { id: transactionId, portfolioId } });
    if (!tx) throw new NotFoundException('Transaction non trouvée');
    await this.txRepo.remove(tx);
    return { deleted: true, id: transactionId };
  }

  // POSITIONS (current, with PRU)
  async getPositions(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();

    const txs = await this.txRepo.find({
      where: { portfolioId },
      relations: ['stock'],
      order: { transactionDate: 'ASC' },
    });

    const positions = new Map<string, { stock: any; quantity: number; totalCost: number; avgCost: number }>();
    for (const tx of txs) {
      const key = tx.stockId;
      const pos = positions.get(key) || { stock: tx.stock, quantity: 0, totalCost: 0, avgCost: 0 };
      if (tx.type === TransactionType.BUY) {
        const qty = Number(tx.quantity) || 0;
        const px = Number(tx.price) || 0;
        const fee = Number(tx.fees) || 0;
        pos.totalCost += qty * px + fee;
        pos.quantity += qty;
      } else {
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

  // === WEEK 7 ===

  /** Portfolio summary with period performance (7d, 30d) */
  async getSummary(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();

    const transactions = await this.txRepo.find({
      where: { portfolioId },
      relations: ['stock'],
      order: { transactionDate: 'ASC' },
    });

    // Load current prices
    const priceFile = '/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json';
    let currentPrices = new Map<string, any>();
    try {
      const eod = JSON.parse(fs.readFileSync(priceFile, 'utf-8'));
      for (const s of eod.stocks || []) currentPrices.set(s.ticker, s);
    } catch {}

    // Load historical prices
    const histFile = '/data/.openclaw/workspace/brvm-os/dashboard/data/history/all_prices.json';
    let historical: Record<string, Record<string, number>> = {};
    try {
      historical = JSON.parse(fs.readFileSync(histFile, 'utf-8'));
    } catch {}

    // Build positions
    const positions = new Map<string, { stock: any; quantity: number; totalCost: number; avgCost: number }>();
    for (const tx of transactions) {
      const ticker = tx.stock?.ticker;
      if (!ticker) continue;
      const key = ticker;
      const pos = positions.get(key) || { stock: tx.stock, quantity: 0, totalCost: 0, avgCost: 0 };
      if (tx.type === TransactionType.BUY) {
        const qty = Number(tx.quantity) || 0;
        const px = Number(tx.price) || 0;
        const fee = Number(tx.fees) || 0;
        pos.totalCost += qty * px + fee;
        pos.quantity += qty;
      } else {
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

    const fmtDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const today = new Date();
    const getAvailableDate = (daysBack: number): string | null => {
      const target = new Date(today);
      target.setDate(target.getDate() - daysBack);
      const targetStr = fmtDate(target);
      const dates = Object.keys(historical).sort();
      for (let i = dates.length - 1; i >= 0; i--) {
        if (dates[i] <= targetStr) return dates[i];
      }
      return null;
    };

    let totalInvested = 0;
    let totalMarketValue = 0;
    const enrichedPositions: any[] = [];

    for (const [ticker, pos] of positions) {
      if (pos.quantity <= 0) continue;
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

  /** Export transactions as CSV */
  async exportCsv(portfolioId: string, userId: string): Promise<string> {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();

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
      const total = tx.type === TransactionType.BUY ? qty * px + fee : -(qty * px) + fee;
      const date = new Date(tx.transactionDate).toLocaleDateString('fr-FR');
      const company = (tx.stock?.companyName || '').replace(/,/g, ';');
      return `${date},${tx.stock?.ticker || ''},${company},${tx.type},${qty},${px.toFixed(2)},${fee.toFixed(2)},${total.toFixed(2)}`;
    });

    return [header, ...rows].join('\n');
  }

  // WATCHLISTS
  async getWatchlists(userId: string) {
    return this.watchlistRepo.find({
      where: { userId },
      relations: ['items', 'items.stock'],
      order: { createdAt: 'DESC' },
    });
  }

  async getWatchlist(watchlistId: string, userId: string) {
    const wl = await this.watchlistRepo.findOne({ where: { id: watchlistId }, relations: ['items', 'items.stock'] });
    if (!wl) throw new NotFoundException('Watchlist non trouvee');
    if (wl.userId !== userId) throw new ForbiddenException('Watchlist non accessible');
    return wl;
  }

  async createWatchlist(userId: string, dto: CreateWatchlistDto) {
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

  async updateWatchlist(watchlistId: string, userId: string, dto: UpdateWatchlistDto) {
    const wl = await this.getWatchlist(watchlistId, userId);
    wl.name = dto.name;
    return this.watchlistRepo.save(wl);
  }

  async deleteWatchlist(watchlistId: string, userId: string) {
    const wl = await this.getWatchlist(watchlistId, userId);
    await this.watchlistRepo.remove(wl);
    return { deleted: true };
  }

  async addToWatchlist(watchlistId: string, userId: string, dto: AddWatchlistItemDto) {
    await this.getWatchlist(watchlistId, userId);
    const stock = await this.stockRepo.findOne({ where: { ticker: dto.ticker } });
    if (!stock) throw new NotFoundException(`Ticker "${dto.ticker}" non trouve`);
    const existing = await this.watchlistItemRepo.findOne({ where: { watchlistId, stockId: stock.id } });
    if (existing) return existing;
    const item = this.watchlistItemRepo.create({ watchlistId, stockId: stock.id });
    return this.watchlistItemRepo.save(item);
  }

  async removeFromWatchlist(watchlistId: string, userId: string, ticker: string) {
    await this.getWatchlist(watchlistId, userId);
    const stock = await this.stockRepo.findOne({ where: { ticker } });
    if (!stock) throw new NotFoundException(`Ticker "${ticker}" non trouve`);
    await this.watchlistItemRepo.delete({ watchlistId, stockId: stock.id });
    return { deleted: true };
  }
}
