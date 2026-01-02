/**
 * CSV Import Service
 * Parses bank statements from different formats
 */

import { Transaction } from '../types';
import { Category, SPENDING_CATEGORIES } from '../constants/Categories';

interface ParsedTransaction {
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
}

// Auto-categorize based on merchant keywords
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
    'Groceries': ['grocery', 'kroger', 'whole foods', 'trader joe', 'safeway', 'publix', 'aldi', 'food lion'],
    'Dining': ['restaurant', 'mcdonald', 'starbucks', 'chipotle', 'wendy', 'burger', 'pizza', 'cafe', 'coffee', 'grubhub', 'doordash', 'uber eats'],
    'Utilities': ['electric', 'water', 'gas bill', 'internet', 'comcast', 'verizon', 'att', 'phone', 'utility'],
    'Transportation': ['uber', 'lyft', 'gas', 'shell', 'chevron', 'exxon', 'parking', 'transit', 'metro'],
    'Shopping': ['amazon', 'walmart', 'target', 'costco', 'best buy', 'home depot', 'lowes', 'ikea', 'macys', 'nordstrom'],
    'Entertainment': ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'concert', 'gaming', 'playstation', 'xbox'],
    'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'medical', 'dental', 'gym', 'fitness'],
    'Subscriptions': ['subscription', 'membership', 'monthly', 'annual'],
    'Credit Card Payment': ['payment', 'credit card', 'autopay'],
    'Savings Transfer': ['transfer', 'savings', 'deposit'],
    'Miscellaneous': [],
};

function categorizeTransaction(description: string): Category {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
            return category as Category;
        }
    }

    return 'Miscellaneous';
}

/**
 * Parse PNC Bank CSV format
 * Expected columns: Date, Description, Withdrawals, Deposits, Balance
 */
function parsePNC(csvContent: string): ParsedTransaction[] {
    const lines = csvContent.trim().split('\n');
    const transactions: ParsedTransaction[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Parse CSV - handle quoted fields
        const fields = parseCSVLine(line);

        if (fields.length >= 4) {
            const date = fields[0];
            const description = fields[1];
            const withdrawal = parseFloat(fields[2]?.replace(/[,$]/g, '') || '0');
            const deposit = parseFloat(fields[3]?.replace(/[,$]/g, '') || '0');

            if (withdrawal > 0) {
                transactions.push({
                    date: formatDate(date),
                    description,
                    amount: withdrawal,
                    type: 'debit',
                });
            } else if (deposit > 0) {
                transactions.push({
                    date: formatDate(date),
                    description,
                    amount: deposit,
                    type: 'credit',
                });
            }
        }
    }

    return transactions;
}

/**
 * Parse American Express CSV format
 * Expected columns: Date, Description, Amount
 */
function parseAmex(csvContent: string): ParsedTransaction[] {
    const lines = csvContent.trim().split('\n');
    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const fields = parseCSVLine(line);

        if (fields.length >= 3) {
            const date = fields[0];
            const description = fields[1];
            const amount = parseFloat(fields[2]?.replace(/[,$]/g, '') || '0');

            transactions.push({
                date: formatDate(date),
                description,
                amount: Math.abs(amount),
                type: amount > 0 ? 'debit' : 'credit',
            });
        }
    }

    return transactions;
}

/**
 * Parse Capital One CSV format
 * Expected columns: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
 */
function parseCapitalOne(csvContent: string): ParsedTransaction[] {
    const lines = csvContent.trim().split('\n');
    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const fields = parseCSVLine(line);

        if (fields.length >= 6) {
            const date = fields[0];
            const description = fields[3];
            const debit = parseFloat(fields[5]?.replace(/[,$]/g, '') || '0');
            const credit = parseFloat(fields[6]?.replace(/[,$]/g, '') || '0');

            if (debit > 0) {
                transactions.push({
                    date: formatDate(date),
                    description,
                    amount: debit,
                    type: 'debit',
                });
            } else if (credit > 0) {
                transactions.push({
                    date: formatDate(date),
                    description,
                    amount: credit,
                    type: 'credit',
                });
            }
        }
    }

    return transactions;
}

/**
 * Generic CSV parser - tries to auto-detect format
 */
function parseGeneric(csvContent: string): ParsedTransaction[] {
    const lines = csvContent.trim().split('\n');
    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const fields = parseCSVLine(line);

        // Try to find date, description, and amount fields
        let date = '', description = '', amount = 0, type: 'debit' | 'credit' = 'debit';

        for (let j = 0; j < fields.length; j++) {
            const field = fields[j];

            // Check if it looks like a date
            if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(field) && !date) {
                date = formatDate(field);
            }
            // Check if it looks like an amount
            else if (/^[\-\$]?\d+\.?\d*$/.test(field.replace(/,/g, ''))) {
                const num = parseFloat(field.replace(/[,$]/g, ''));
                if (num !== 0) {
                    amount = Math.abs(num);
                    type = num < 0 ? 'credit' : 'debit';
                }
            }
            // Otherwise treat as description
            else if (field.length > 3 && !description) {
                description = field;
            }
        }

        if (date && description && amount > 0) {
            transactions.push({ date, description, amount, type });
        }
    }

    return transactions;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    fields.push(current.trim());
    return fields;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
    // Try different date formats
    const parts = dateStr.split(/[\/\-]/);

    if (parts.length === 3) {
        let month = parseInt(parts[0]);
        let day = parseInt(parts[1]);
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
            year += 2000;
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return dateStr;
}

export type BankType = 'pnc' | 'amex' | 'capital_one' | 'auto';

export function parseCSV(csvContent: string, bankType: BankType = 'auto'): Transaction[] {
    let parsed: ParsedTransaction[] = [];

    switch (bankType) {
        case 'pnc':
            parsed = parsePNC(csvContent);
            break;
        case 'amex':
            parsed = parseAmex(csvContent);
            break;
        case 'capital_one':
            parsed = parseCapitalOne(csvContent);
            break;
        case 'auto':
        default:
            // Try each parser and use the one that gives the most results
            const pnc = parsePNC(csvContent);
            const amex = parseAmex(csvContent);
            const capOne = parseCapitalOne(csvContent);
            const generic = parseGeneric(csvContent);

            parsed = [pnc, amex, capOne, generic].sort((a, b) => b.length - a.length)[0];
            break;
    }

    // Convert to Transaction format
    return parsed.map((t, index) => ({
        id: `imported_${Date.now()}_${index}`,
        accountId: 'imported',
        amount: t.type === 'debit' ? -t.amount : t.amount,
        date: t.date,
        merchantName: t.description,
        category: categorizeTransaction(t.description),
        isPending: false,
        manual: false,
        type: t.type === 'debit' ? 'expense' as const : 'income' as const,
    }));
}

export function detectBankType(csvContent: string): BankType {
    const header = csvContent.split('\n')[0].toLowerCase();

    if (header.includes('withdrawals') && header.includes('deposits')) {
        return 'pnc';
    }
    if (header.includes('card no') || header.includes('posted date')) {
        return 'capital_one';
    }
    if (header.includes('reference') || header.includes('appears on')) {
        return 'amex';
    }

    return 'auto';
}
