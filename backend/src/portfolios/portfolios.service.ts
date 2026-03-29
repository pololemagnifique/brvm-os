import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Transaction, TransactionType } from './transaction.entity';
import { Watchlist } from './watchlist.entity';
import { WatchlistItem } from './watchlist-item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Watchlist) private watchlistRepo: Repository<Watchlist>,
    @InjectRepository(WatchlistItem) private watchlistItemRepo: Repository<WatchlistItem>,
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

  async createWatchlist(userId: string, name: string) {
    const wl = this.watchlistRepo.create({ name, userId });
    return this.watchlistRepo.save(wl);
  }

  async addToWatchlist(watchlistId: string, userId: string, dto: AddWatchlistItemDto) {
    const wl = await this.watchlistRepo.findOne({ where: { id: watchlistId } });
    if (!wl || wl.userId !== userId) throw new ForbiddenException('Watchlist non accessible');

    const item = this.watchlistItemRepo.create({ watchlistId, stockId: dto.stockId });
    return this.watchlistItemRepo.save(item);
  }

  async removeFromWatchlist(watchlistId: string, userId: string, stockId: string) {
    const wl = await this.watchlistRepo.findOne({ where: { id: watchlistId } });
    if (!wl || wl.userId !== userId) throw new ForbiddenException();

    await this.watchlistItemRepo.delete({ watchlistId, stockId });
    return { deleted: true };
  }
}
