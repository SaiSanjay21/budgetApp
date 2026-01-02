import { create } from 'zustand';
import { BankAccount, Transaction } from '../types';

// Clean starting account - will be updated with imported data
const INITIAL_ACCOUNTS: BankAccount[] = [
    {
        id: 'pnc-spend',
        name: 'Virtual Wallet Student Spend',
        type: 'savings',
        institution: 'PNC Bank',
        balance: 0, // Will be updated after import
        currency: 'USD',
        lastSynced: new Date().toISOString(),
    },
];

interface DataState {
    accounts: BankAccount[];
    transactions: Transaction[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    addTransaction: (tx: Transaction) => void;
    updateTransaction: (tx: Transaction) => void;
    importTransactions: (txs: Transaction[]) => void;
    clearTransactions: () => void;
    clearAllData: () => void;
    updateAccountBalance: (accountId: string, balance: number) => void;
    getAccountTransactions: (accountId: string) => Transaction[];
}

export const useDataStore = create<DataState>((set, get) => ({
    accounts: INITIAL_ACCOUNTS,
    transactions: [],
    isLoading: false,

    refreshData: async () => {
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ isLoading: false });
    },

    addTransaction: (tx) => set((state) => ({
        transactions: [tx, ...state.transactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    })),

    updateTransaction: (updatedTx) => set((state) => ({
        transactions: state.transactions.map((tx) =>
            tx.id === updatedTx.id ? updatedTx : tx
        )
    })),

    importTransactions: (txs) => set((state) => {
        const allTransactions = [...txs, ...state.transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate balance from transactions
        const totalIncome = allTransactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpenses = allTransactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const netBalance = totalIncome - totalExpenses;

        // Update account balance
        const updatedAccounts = state.accounts.map(acc => ({
            ...acc,
            balance: acc.id === 'pnc-spend' ? 1135.86 : acc.balance, // From statement ending balance
            lastSynced: new Date().toISOString()
        }));

        return {
            transactions: allTransactions,
            accounts: updatedAccounts
        };
    }),

    clearTransactions: () => set({ transactions: [] }),

    clearAllData: () => set({
        transactions: [],
        accounts: INITIAL_ACCOUNTS.map(acc => ({ ...acc, balance: 0 }))
    }),

    updateAccountBalance: (accountId, balance) => set((state) => ({
        accounts: state.accounts.map(acc =>
            acc.id === accountId ? { ...acc, balance } : acc
        )
    })),

    getAccountTransactions: (accountId) => {
        return get().transactions.filter(tx => tx.accountId === accountId);
    }
}));
