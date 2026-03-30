import { Repository } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Transaction } from './transaction.entity';
import { Watchlist } from './watchlist.entity';
import { WatchlistItem } from './watchlist-item.entity';
import { Stock } from '../stocks/stock.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddWatchlistItemDto, CreateWatchlistDto, UpdateWatchlistDto } from './dto/add-watchlist-item.dto';
export declare class PortfoliosService {
    private portfolioRepo;
    private txRepo;
    private watchlistRepo;
    private watchlistItemRepo;
    private stockRepo;
    constructor(portfolioRepo: Repository<Portfolio>, txRepo: Repository<Transaction>, watchlistRepo: Repository<Watchlist>, watchlistItemRepo: Repository<WatchlistItem>, stockRepo: Repository<Stock>);
    getPortfolios(userId: string): Promise<Portfolio[]>;
    createPortfolio(userId: string, dto: CreatePortfolioDto): Promise<Portfolio>;
    getTransactions(portfolioId: string, userId: string): Promise<Transaction[]>;
    addTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto): Promise<Transaction>;
    getPositions(portfolioId: string, userId: string): Promise<any[]>;
    getWatchlists(userId: string): Promise<Watchlist[]>;
    getWatchlist(watchlistId: string, userId: string): Promise<Watchlist>;
    createWatchlist(userId: string, dto: CreateWatchlistDto): Promise<Watchlist>;
    updateWatchlist(watchlistId: string, userId: string, dto: UpdateWatchlistDto): Promise<Watchlist>;
    deleteWatchlist(watchlistId: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    addToWatchlist(watchlistId: string, userId: string, dto: AddWatchlistItemDto): Promise<WatchlistItem>;
    removeFromWatchlist(watchlistId: string, userId: string, ticker: string): Promise<{
        deleted: boolean;
    }>;
}
