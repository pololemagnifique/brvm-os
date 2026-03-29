import { Repository } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Transaction } from './transaction.entity';
import { Watchlist } from './watchlist.entity';
import { WatchlistItem } from './watchlist-item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';
export declare class PortfoliosService {
    private portfolioRepo;
    private txRepo;
    private watchlistRepo;
    private watchlistItemRepo;
    constructor(portfolioRepo: Repository<Portfolio>, txRepo: Repository<Transaction>, watchlistRepo: Repository<Watchlist>, watchlistItemRepo: Repository<WatchlistItem>);
    getPortfolios(userId: string): Promise<Portfolio[]>;
    createPortfolio(userId: string, dto: CreatePortfolioDto): Promise<Portfolio>;
    getTransactions(portfolioId: string, userId: string): Promise<Transaction[]>;
    addTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto): Promise<Transaction>;
    getPositions(portfolioId: string, userId: string): Promise<any[]>;
    getWatchlists(userId: string): Promise<Watchlist[]>;
    createWatchlist(userId: string, name: string): Promise<Watchlist>;
    addToWatchlist(watchlistId: string, userId: string, dto: AddWatchlistItemDto): Promise<WatchlistItem>;
    removeFromWatchlist(watchlistId: string, userId: string, stockId: string): Promise<{
        deleted: boolean;
    }>;
}
