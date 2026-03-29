import { User } from '../users/user.entity';
import { Stock } from '../stocks/stock.entity';
export declare enum AlertType {
    PRICE_ABOVE = "PRICE_ABOVE",
    PRICE_BELOW = "PRICE_BELOW",
    CHANGE_PCT = "CHANGE_PCT",
    VOLUME_SPIKE = "VOLUME_SPIKE"
}
export declare class Alert {
    id: string;
    userId: string;
    user: User;
    stockId: string;
    stock: Stock;
    type: AlertType;
    condition: string;
    threshold: number;
    isActive: boolean;
    lastTriggered: Date;
    createdAt: Date;
    updatedAt: Date;
}
