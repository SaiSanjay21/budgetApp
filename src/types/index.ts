export type AccountType = 'savings' | 'credit';

export interface BankAccount {
    id: string;
    name: string;
    type: AccountType;
    institution: string;
    balance: number;
    currency: string;
    lastSynced: string;
    creditLimit?: number; // Only for credit cards
    apy?: number; // Only for savings
}

export type TransactionType = 'expense' | 'income' | 'transfer' | 'payment';

export interface Transaction {
    id: string;
    accountId: string;
    amount: number;
    date: string; // ISO 8601
    merchantName: string;
    description?: string;
    category: string;
    type: TransactionType;
    isPending: boolean;
    manual: boolean;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    biometricEnabled: boolean;
}

export interface Budget {
    categoryId: string;
    limit: number;
    spent: number;
}
