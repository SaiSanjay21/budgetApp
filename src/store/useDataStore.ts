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
    /** IDs of subscriptions the user has dismissed/cancelled */
    dismissedSubscriptionIds: string[];
    refreshData: () => Promise<void>;
    addTransaction: (tx: Transaction) => void;
    updateTransaction: (tx: Transaction) => void;
    importTransactions: (txs: Transaction[], accountName?: string) => void;
    clearTransactions: () => void;
    clearAllData: () => void;
    updateAccountBalance: (accountId: string, balance: number) => void;
    getAccountTransactions: (accountId: string) => Transaction[];
    /** Dismiss a subscription so it's excluded from predictions */
    dismissSubscription: (subscriptionId: string) => void;
    /** Restore a previously dismissed subscription */
    restoreSubscription: (subscriptionId: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
    accounts: INITIAL_ACCOUNTS,
    transactions: [],
    isLoading: false,
    dismissedSubscriptionIds: [],

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

    importTransactions: (txs, accountNameInput = 'Imported Account') => set((state) => {
        // 1. Determine or Create Account
        // Check if an account with this name already exists
        let targetAccount = state.accounts.find(
            acc => acc.name.toLowerCase().includes(accountNameInput.toLowerCase()) ||
                acc.id === accountNameInput
        );

        let updatedAccounts = [...state.accounts];
        let targetAccountId = targetAccount ? targetAccount.id : `acc_${Date.now()}`;

        if (!targetAccount) {
            // Create new account if not found
            targetAccount = {
                id: targetAccountId,
                name: accountNameInput,
                type: accountNameInput.toLowerCase().includes('card') ? 'credit' : 'savings', // simple heuristic
                institution: accountNameInput,
                balance: 0,
                currency: 'USD',
                lastSynced: new Date().toISOString(),
            };
            updatedAccounts.push(targetAccount);
        }

        // 2. Link Transactions to this Account
        const newTransactions = txs.map(tx => ({
            ...tx,
            accountId: targetAccountId // Overwrite the generic 'imported' id
        }));

        const allTransactions = [...newTransactions, ...state.transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 3. Recalculate Balance for the Target Account ONLY
        // We calculate balance based on ALL transactions for this account (old + new)
        const accountTransactions = allTransactions.filter(tx => tx.accountId === targetAccountId);

        const totalIncome = accountTransactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpenses = accountTransactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        const newBalance = totalIncome - totalExpenses;

        updatedAccounts = updatedAccounts.map(acc =>
            acc.id === targetAccountId
                ? { ...acc, balance: newBalance, lastSynced: new Date().toISOString() }
                : acc
        );

        return {
            transactions: allTransactions,
            accounts: updatedAccounts
        };
    }),

    clearTransactions: () => set({ transactions: [] }),

    clearAllData: () => set({
        transactions: [],
        accounts: INITIAL_ACCOUNTS.map(acc => ({ ...acc, balance: 0 })),
        dismissedSubscriptionIds: [],
    }),

    updateAccountBalance: (accountId, balance) => set((state) => ({
        accounts: state.accounts.map(acc =>
            acc.id === accountId ? { ...acc, balance } : acc
        )
    })),

    getAccountTransactions: (accountId) => {
        return get().transactions.filter(tx => tx.accountId === accountId);
    },

    dismissSubscription: (subscriptionId) => set((state) => ({
        dismissedSubscriptionIds: [...state.dismissedSubscriptionIds, subscriptionId],
    })),

    restoreSubscription: (subscriptionId) => set((state) => ({
        dismissedSubscriptionIds: state.dismissedSubscriptionIds.filter(id => id !== subscriptionId),
    })),
}));
