import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  // POSITIONS CALCULATED (PRU, P&L)
  async getPositions(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portefeuille non trouvé');
    if (portfolio.userId !== userId) throw new ForbiddenException();

    const txs = await this.txRepo.find({
      where: { portfolioId },
      relations: ['stock'],
      order: { transactionDate: 'ASC' },
    });

    // Build positions
    const positions = new Map<string, { stock: any; quantity: number; totalCost: number; avgCost: number }>();
    for (const tx of txs) {
      const key = tx.stockId;
      const pos = positions.get(key) || { stock: tx.stock, quantity: 0, totalCost: 0, avgCost: 0 };
      if (tx.type === TransactionType.BUY) {
        pos.totalCost += tx.quantity * tx.price + (tx.fees || 0);
        pos.quantity += tx.quantity;
      } else {
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

  // WATCHLISTS
  async getWatchlists(userId: string) {
    return this.watchlistRepo.find({
      where: { userId },
      relations: ['items', 'items.stock'],
      order: { createdAt: 'DESC' },
    });
  }

  async getWatchlist(watchlistId: string, userId: string) {
    const wl = await this.watchlistRepo.findOne({
      where: { id: watchlistId },
      relations: ['items', 'items.stock'],
    });
    if (!wl) throw new NotFoundException('Watchlist non trouvée');
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
    const wl = await this.getWatchlist(watchlistId, userId);

    const stock = await this.stockRepo.findOne({ where: { ticker: dto.ticker } });
    if (!stock) throw new NotFoundException(`Ticker "${dto.ticker}" non trouvé`);

    // Check if already exists
    const existing = await this.watchlistItemRepo.findOne({ where: { watchlistId, stockId: stock.id } });
    if (existing) return existing;

    const item = this.watchlistItemRepo.create({ watchlistId, stockId: stock.id });
    return this.watchlistItemRepo.save(item);
  }

  async removeFromWatchlist(watchlistId: string, userId: string, ticker: string) {
    const wl = await this.getWatchlist(watchlistId, userId);
    const stock = await this.stockRepo.findOne({ where: { ticker } });
    if (!stock) throw new NotFoundException(`Ticker "${ticker}" non trouvé`);

    await this.watchlistItemRepo.delete({ watchlistId, stockId: stock.id });
    return { deleted: true };
  }
}
