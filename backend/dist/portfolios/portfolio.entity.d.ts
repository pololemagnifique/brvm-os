import { User } from '../users/user.entity';
export declare class Portfolio {
    id: string;
    userId: string;
    user: User;
    name: string;
    description: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
