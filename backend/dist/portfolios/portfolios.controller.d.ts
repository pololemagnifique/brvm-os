import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateWatchlistDto, UpdateWatchlistDto } from './dto/add-watchlist-item.dto';
export declare class PortfoliosController {
    private portfoliosService;
    constructor(portfoliosService: PortfoliosService);
    getPortfolios(req: any): Promise<import("./portfolio.entity").Portfolio[]>;
    createPortfolio(req: any, dto: CreatePortfolioDto): Promise<import("./portfolio.entity").Portfolio>;
    getTransactions(id: string, req: any): Promise<import("./transaction.entity").Transaction[]>;
    addTransaction(id: string, req: any, dto: CreateTransactionDto): Promise<import("./transaction.entity").Transaction>;
    deleteTransaction(portfolioId: string, transactionId: string, req: any): Promise<{
        deleted: boolean;
        id: string;
    }>;
    getPositions(id: string, req: any): Promise<any[]>;
    getSummary(id: string, req: any): Promise<{
        portfolio: import("./portfolio.entity").Portfolio;
        totalInvested: number;
        totalMarketValue: number;
        totalUnrealizedPnl: number;
        totalPnlPct: number;
        positions: any[];
        transactionsCount: number;
        updatedAt: string;
    }>;
    getTransactionsCsv(id: string, req: any, res: any): Promise<void>;
    getWatchlists(req: any): Promise<import("./watchlist.entity").Watchlist[]>;
    createWatchlist(req: any, dto: CreateWatchlistDto): Promise<import("./watchlist.entity").Watchlist>;
    getWatchlist(id: string, req: any): Promise<import("./watchlist.entity").Watchlist>;
    updateWatchlist(id: string, req: any, dto: UpdateWatchlistDto): Promise<import("./watchlist.entity").Watchlist>;
    deleteWatchlist(id: string, req: any): Promise<{
        deleted: boolean;
    }>;
    addToWatchlist(id: string, req: any, dto: any): Promise<import("./watchlist-item.entity").WatchlistItem>;
    removeFromWatchlist(id: string, ticker: string, req: any): Promise<{
        deleted: boolean;
    }>;
}
