import { create } from 'zustand';
import { BankAccount, Transaction } from '../types';
import { INITIAL_ACCOUNTS, generateMockTransactions } from '../services/mockData';

interface DataState {
    accounts: BankAccount[];
    transactions: Transaction[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    addTransaction: (tx: Transaction) => void;
    updateTransaction: (tx: Transaction) => void;
    getAccountTransactions: (accountId: string) => Transaction[];
}

export const useDataStore = create<DataState>((set, get) => ({
    accounts: INITIAL_ACCOUNTS,
    transactions: [],
    isLoading: false,
    refreshData: async () => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate initial transactions if empty
        const currentTransactions = get().transactions;
        if (currentTransactions.length === 0) {
            const allTx: Transaction[] = [];
            INITIAL_ACCOUNTS.forEach(acc => {
                allTx.push(...generateMockTransactions(acc.id, 15));
            });
            // Sort by date desc
            allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ transactions: allTx });
        }

        set({ isLoading: false });
    },
    addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),
    updateTransaction: (updatedTx) => set((state) => ({
        transactions: state.transactions.map((tx) => tx.id === updatedTx.id ? updatedTx : tx)
    })),
    getAccountTransactions: (accountId) => {
        return get().transactions.filter(tx => tx.accountId === accountId);
    }
}));
