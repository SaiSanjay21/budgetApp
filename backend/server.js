/**
 * Secure Plaid Backend Server
 * 
 * This server handles all Plaid API calls to keep the secret safe.
 * NEVER expose the Plaid secret to the frontend.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const app = express();
app.use(cors());
app.use(express.json());

// Plaid client configuration
const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(configuration);

// Store access tokens securely (in production, use encrypted database)
const accessTokens = new Map();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.PLAID_ENV });
});

// Create a Link token (step 1 of connecting a bank)
app.post('/api/plaid/create-link-token', async (req, res) => {
    try {
        const { userId } = req.body;

        const response = await plaidClient.linkTokenCreate({
            user: { client_user_id: userId || 'user-' + Date.now() },
            client_name: 'BudgetFree',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        });

        res.json({ link_token: response.data.link_token });
    } catch (error) {
        console.error('Error creating link token:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create link token' });
    }
});

// Exchange public token for access token (step 2 - after user authenticates)
app.post('/api/plaid/exchange-token', async (req, res) => {
    try {
        const { public_token, userId } = req.body;

        const response = await plaidClient.itemPublicTokenExchange({
            public_token: public_token,
        });

        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // Store access token (in production: encrypt and store in database)
        accessTokens.set(userId || 'default', { accessToken, itemId });

        res.json({ success: true, item_id: itemId });
    } catch (error) {
        console.error('Error exchanging token:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
});

// Get account information
app.post('/api/plaid/accounts', async (req, res) => {
    try {
        const { userId } = req.body;
        const tokenData = accessTokens.get(userId || 'default');

        if (!tokenData) {
            return res.status(400).json({ error: 'No linked account found' });
        }

        const response = await plaidClient.accountsGet({
            access_token: tokenData.accessToken,
        });

        res.json({ accounts: response.data.accounts });
    } catch (error) {
        console.error('Error getting accounts:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get accounts' });
    }
});

// Get transactions
app.post('/api/plaid/transactions', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;
        const tokenData = accessTokens.get(userId || 'default');

        if (!tokenData) {
            return res.status(400).json({ error: 'No linked account found' });
        }

        // Default to last 30 days
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await plaidClient.transactionsGet({
            access_token: tokenData.accessToken,
            start_date: start,
            end_date: end,
        });

        res.json({
            transactions: response.data.transactions,
            accounts: response.data.accounts,
            total_transactions: response.data.total_transactions
        });
    } catch (error) {
        console.error('Error getting transactions:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// Get institution info
app.post('/api/plaid/institution', async (req, res) => {
    try {
        const { institutionId } = req.body;

        const response = await plaidClient.institutionsGetById({
            institution_id: institutionId,
            country_codes: [CountryCode.Us],
        });

        res.json({ institution: response.data.institution });
    } catch (error) {
        console.error('Error getting institution:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get institution' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🔐 Secure Plaid backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.PLAID_ENV || 'sandbox'}`);
});
