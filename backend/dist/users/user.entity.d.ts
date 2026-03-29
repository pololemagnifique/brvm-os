export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    emailVerificationToken: string;
    createdAt: Date;
    updatedAt: Date;
}
