/**
 * Plaid Service - Frontend API calls to our secure backend
 * 
 * IMPORTANT: All Plaid API calls go through our backend.
 * The Plaid secret is NEVER exposed to the frontend.
 */

const BACKEND_URL = 'http://localhost:3001';

export interface PlaidAccount {
    account_id: string;
    name: string;
    official_name: string | null;
    type: string;
    subtype: string;
    mask: string;
    balances: {
        current: number | null;
        available: number | null;
        limit: number | null;
    };
}

export interface PlaidTransaction {
    transaction_id: string;
    account_id: string;
    amount: number;
    date: string;
    name: string;
    merchant_name: string | null;
    category: string[];
    pending: boolean;
}

class PlaidService {
    private userId: string;

    constructor() {
        this.userId = 'user-' + Date.now();
    }

    /**
     * Get a link token to initialize Plaid Link
     */
    async createLinkToken(): Promise<string> {
        const response = await fetch(`${BACKEND_URL}/api/plaid/create-link-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to create link token');
        }

        const data = await response.json();
        return data.link_token;
    }

    /**
     * Exchange public token for access token (after Plaid Link success)
     */
    async exchangeToken(publicToken: string): Promise<boolean> {
        const response = await fetch(`${BACKEND_URL}/api/plaid/exchange-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                public_token: publicToken,
                userId: this.userId
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange token');
        }

        const data = await response.json();
        return data.success;
    }

    /**
     * Get connected accounts
     */
    async getAccounts(): Promise<PlaidAccount[]> {
        const response = await fetch(`${BACKEND_URL}/api/plaid/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to get accounts');
        }

        const data = await response.json();
        return data.accounts;
    }

    /**
     * Get transactions for the last 30 days
     */
    async getTransactions(startDate?: string, endDate?: string): Promise<{
        transactions: PlaidTransaction[];
        accounts: PlaidAccount[];
        total: number;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/plaid/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: this.userId,
                startDate,
                endDate
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get transactions');
        }

        const data = await response.json();
        return {
            transactions: data.transactions,
            accounts: data.accounts,
            total: data.total_transactions,
        };
    }
}

export const plaidService = new PlaidService();
