import { User } from '../users/user.entity';
import { WatchlistItem } from './watchlist-item.entity';
export declare class Watchlist {
    id: string;
    userId: string;
    user: User;
    name: string;
    isDefault: boolean;
    items: WatchlistItem[];
    createdAt: Date;
    updatedAt: Date;
}
