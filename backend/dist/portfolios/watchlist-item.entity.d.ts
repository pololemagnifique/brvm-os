import { Watchlist } from './watchlist.entity';
import { Stock } from '../stocks/stock.entity';
export declare class WatchlistItem {
    id: string;
    watchlistId: string;
    watchlist: Watchlist;
    stockId: string;
    stock: Stock;
    addedAt: Date;
}
