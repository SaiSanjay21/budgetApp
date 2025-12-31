import { BankAccount, Transaction, TransactionType } from '../types';
import { SPENDING_CATEGORIES } from '../constants/Categories';

export const INITIAL_ACCOUNTS: BankAccount[] = [
    {
        id: 'acc_savings_01',
        name: 'High Yield Savings',
        type: 'savings',
        institution: 'Chase',
        balance: 15420.50,
        currency: 'USD',
        lastSynced: new Date().toISOString(),
        apy: 4.5
    },
    {
        id: 'acc_cc_discover',
        name: 'Discover it Cash Back',
        type: 'credit',
        institution: 'Discover',
        balance: 450.25, // Owed
        currency: 'USD',
        lastSynced: new Date().toISOString(),
        creditLimit: 5000
    },
    {
        id: 'acc_cc_capone',
        name: 'Quicksilver',
        type: 'credit',
        institution: 'Capital One',
        balance: 120.00,
        currency: 'USD',
        lastSynced: new Date().toISOString(),
        creditLimit: 3000
    },
    {
        id: 'acc_cc_walmart',
        name: 'Walmart Rewards',
        type: 'credit',
        institution: 'Walmart',
        balance: 89.99,
        currency: 'USD',
        lastSynced: new Date().toISOString(),
        creditLimit: 2000
    }
];

export const generateMockTransactions = (accountId: string, count: number = 10): Transaction[] => {
    return Array.from({ length: count }).map((_, i) => {
        const isExpense = Math.random() > 0.3;
        const category = SPENDING_CATEGORIES[Math.floor(Math.random() * SPENDING_CATEGORIES.length)];

        return {
            id: `tx_${accountId}_${i}`,
            accountId,
            amount: parseFloat((Math.random() * 100).toFixed(2)),
            date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
            merchantName: isExpense ? `Store ${i}` : 'Deposit',
            category: isExpense ? category : 'Income',
            type: isExpense ? 'expense' : 'income',
            isPending: Math.random() > 0.9,
            manual: false
        };
    });
};
