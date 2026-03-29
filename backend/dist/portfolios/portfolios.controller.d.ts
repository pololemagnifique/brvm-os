import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';
export declare class PortfoliosController {
    private portfoliosService;
    constructor(portfoliosService: PortfoliosService);
    getPortfolios(req: any): Promise<import("./portfolio.entity").Portfolio[]>;
    createPortfolio(req: any, dto: CreatePortfolioDto): Promise<import("./portfolio.entity").Portfolio>;
    getTransactions(id: string, req: any): Promise<import("./transaction.entity").Transaction[]>;
    addTransaction(id: string, req: any, dto: CreateTransactionDto): Promise<import("./transaction.entity").Transaction>;
    getPositions(id: string, req: any): Promise<any[]>;
    getWatchlists(req: any): Promise<import("./watchlist.entity").Watchlist[]>;
    createWatchlist(req: any, body: {
        name: string;
    }): Promise<import("./watchlist.entity").Watchlist>;
    addToWatchlist(id: string, req: any, dto: AddWatchlistItemDto): Promise<import("./watchlist-item.entity").WatchlistItem>;
    removeFromWatchlist(watchlistId: string, stockId: string, req: any): Promise<{
        deleted: boolean;
    }>;
}
