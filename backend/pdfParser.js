/**
 * PDF Statement Parser
 * Extracts transactions from bank statement PDFs
 * Supports PNC, Generic Bank, and Generic Credit Card formats
 */

const pdfParse = require('pdf-parse');
const { parseStatementWithPerplexity } = require('./perplexityChatService');
require('dotenv').config();

// Category keywords for auto-categorization
const CATEGORY_KEYWORDS = {
    'Groceries': ['grocery', 'kroger', 'whole foods', 'trader joe', 'safeway', 'publix', 'aldi', 'food lion', 'wegmans', 'giant', 'shoprite', 'h-e-b', 'sprouts'],
    'Dining': ['restaurant', 'mcdonald', 'starbucks', 'chipotle', 'wendy', 'burger', 'pizza', 'cafe', 'coffee', 'grubhub', 'doordash', 'uber eats', 'taco', 'subway', 'panera', 'chick-fil'],
    'Utilities': ['electric', 'water', 'gas bill', 'internet', 'comcast', 'verizon', 'att', 'phone', 'utility', 'power', 'energy', 't-mobile'],
    'Transportation': ['uber', 'lyft', 'gas', 'shell', 'chevron', 'exxon', 'parking', 'transit', 'metro', 'fuel', 'sunoco', 'bp', 'wawa'],
    'Shopping': ['amazon', 'walmart', 'target', 'costco', 'best buy', 'home depot', 'lowes', 'ikea', 'macys', 'nordstrom', 'kohls', 'tjmaxx'],
    'Entertainment': ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'concert', 'gaming', 'playstation', 'xbox', 'apple music'],
    'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'medical', 'dental', 'gym', 'fitness', 'health'],
    'Subscriptions': ['subscription', 'membership', 'monthly', 'annual', 'prime', 'openai', 'jobright', 'whisprgpt'],
    'Credit Card Payment': ['amex', 'epayment', 'credit card', 'thank you', 'payment received', 'auto-pay'],
    'Savings Transfer': ['transfer', 'savings', 'deposit'],
};

function categorizeTransaction(description) {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
            return category;
        }
    }

    return 'Miscellaneous';
}

/**
 * Parse a PDF bank statement and extract transactions
 */
async function parsePDFStatement(pdfBuffer) {
    try {
        const data = await pdfParse(pdfBuffer);
        const text = data.text || '';

        console.log('PDF Text extracted, length:', text.length);

        let transactions = [];

        // 0. Try Perplexity AI Automation first
        // We trigger this if the text is complex or if explicitly requested. 
        // For now, let's try it for "Credit Card" style statements that are hard to parse regex-wise,
        // OR simply try it always if fast enough. 
        // Given it launches a browser, it might be slow (10-20s). 
        // Let's use it as the primary "Smart Parse" method.

        console.log('Attempting Perplexity AI parsing...');
        const aiResult = await parseStatementWithPerplexity(text);

        if (aiResult.success && aiResult.transactions && aiResult.transactions.length > 0) {
            console.log(`Perplexity extracted ${aiResult.transactions.length} transactions from ${aiResult.bankName}`);
            return {
                success: true,
                transactions: deduplicateTransactions(aiResult.transactions),
                detectedBank: aiResult.bankName || 'Imported Account',
                rawText: text.substring(0, 500) + '...'
            };
        } else {
            console.log('Perplexity parsing failed or returned no data, falling back to Regex...');
        }

        // 1. Fallback: Try PNC-specific parser
        if (text.includes('PNC Bank') || text.includes('pnc.com')) {
            console.log('Detected PNC Bank Statement');
            transactions = extractPNCTransactions(text);
        }

        // 2. If PNC failed or not PNC, try Credit Card format (typically 5 columns: Trans Date, Post Date, Desc, Ref, Amount)
        if (transactions.length === 0 && (text.includes('Payment Due Date') || text.includes('Credit Limit') || text.includes('APR'))) {
            console.log('Detected Credit Card Statement');
            transactions = extractCreditCardTransactions(text);
        }

        // 3. If still empty, try generic parser
        if (transactions.length === 0) {
            console.log('Using Generic Parser');
            transactions = extractTransactionsFromText(text);
        }

        return {
            success: true,
            transactions: deduplicateTransactions(transactions),
            detectedBank: text.includes('PNC Bank') ? 'PNC Bank' : (text.includes('Payment Due Date') ? 'Credit Card' : 'Generic Bank'),
            rawText: text.substring(0, 500) + '...'
        };
    } catch (error) {
        console.error('PDF Parse Error:', error);
        return {
            success: false,
            error: error.message,
            transactions: []
        };
    }
}



/**
 * Extract transactions from PNC Bank statement
 */
function extractPNCTransactions(text) {
    const transactions = [];
    const sections = text.split(/(Deposits and Other Additions|Banking\/Debit Card|Online and Electronic Banking|Checks\s+paid)/i);
    let currentType = 'expense';

    for (const section of sections) {
        if (section.toLowerCase().includes('deposits') || section.toLowerCase().includes('additions')) {
            currentType = 'income';
        } else if (section.toLowerCase().includes('debit') || section.toLowerCase().includes('deductions') ||
            section.toLowerCase().includes('withdrawals') || section.toLowerCase().includes('checks')) {
            currentType = 'expense';
        }

        const lines = section.split('\n');
        for (const line of lines) {
            const dateAmountMatch = line.trim().match(/^(\d{2}\/\d{2})\s*(\d+\.?\d{2})\s+(.+)/);
            if (dateAmountMatch) {
                const [_, dateStr, amountStr, description] = dateAmountMatch;
                const amount = parseFloat(amountStr);

                if (amount > 0 && description.length > 2) {
                    const cleanDesc = description.replace(/\s+/g, ' ').replace(/St-[A-Z0-9]+/gi, '').trim();
                    transactions.push({
                        date: formatDate(dateStr),
                        description: cleanDesc,
                        amount: amount,
                        type: currentType === 'income' ? 'credit' : 'debit',
                        category: categorizeTransaction(cleanDesc)
                    });
                }
            }
        }
    }
    return transactions;
}

/**
 * Extract transactions from Credit Card format (Date Date Desc Amount)
 */
function extractCreditCardTransactions(text) {
    const transactions = [];
    const lines = text.split('\n');

    // Pattern: MM/DD (optional MM/DD) Description... $Amount or Amount
    // Matches: 12/01 12/02 Starbucks 5.40
    // Updated to be more flexible with spacing and currency symbols
    const ccPattern = /(\d{2}\/\d{2})\s+(?:\d{2}\/\d{2}\s+)?(.+?)\s+([\-\$]?\s*[\d,]+\.\d{2})/;

    for (const line of lines) {
        const match = line.trim().match(ccPattern);
        if (match) {
            const [_, transDate, description, amountStr] = match;

            // Clean amount: remove $, commas, and spaces
            let amount = parseFloat(amountStr.replace(/[$,\s]/g, ''));

            // Explicit NaN check
            if (isNaN(amount) || amount === 0) continue;

            const isPayment = description.toLowerCase().includes('payment') || description.toLowerCase().includes('thank you') || amount < 0;
            const isCredit = isPayment; // In CC context, payments are credits (reduce balance)

            // Typically CC statements show expenses as positive numbers in the "New Charges" section
            // But sometimes refunds are negative.
            // We'll trust the sign if it's explicitly negative.
            // If it's positive but "Payment", it's a credit.

            const cleanDesc = description.trim();
            if (cleanDesc.length < 2) continue;

            // Exclude headers
            if (cleanDesc.includes('Opening Balance') || cleanDesc.includes('Closing Balance')) continue;

            transactions.push({
                date: formatDate(transDate),
                description: cleanDesc,
                amount: Math.abs(amount), // We handle sign in server.js based on type
                type: isCredit ? 'credit' : 'debit',
                category: categorizeTransaction(cleanDesc)
            });
        }
    }

    return transactions;
}

/**
 * Extract transactions from PDF text - generic parser
 */
function extractTransactionsFromText(text) {
    const transactions = [];
    const lines = text.split('\n');

    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const amountPattern = /[\-\$]?\$?[\d,]+\.\d{2}/g;

    for (const line of lines) {
        const l = line.trim();
        if (!l) continue;

        // Skip common header/footer lines that might look like transactions
        if (l.toLowerCase().includes('page') || l.toLowerCase().includes('balance') || l.toLowerCase().includes('total')) continue;

        const dateMatch = l.match(datePattern);
        if (!dateMatch) continue;

        const amounts = l.match(amountPattern);
        if (!amounts || amounts.length === 0) continue;

        // Robust amount cleaning
        const amountStr = amounts[amounts.length - 1]; // improved to take last match which is usually the transaction amount
        // Remove '$', ',' and whitespace before parsing
        const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
        const amount = parseFloat(cleanAmountStr);

        // Explicit NaN check - CRITICAL FIX
        if (isNaN(amount) || amount === 0) {
            console.log(`Skipping invalid amount: ${amountStr} in line: ${l}`);
            continue;
        }

        const dateIndex = l.indexOf(dateMatch[0]);
        // Be careful finding amount index, it might appear multiple times
        // We assume description is between date and the LAST amount
        const amountIndex = l.lastIndexOf(amountStr);

        if (amountIndex <= dateIndex) continue; // Safety check

        let description = l.substring(dateIndex + dateMatch[0].length, amountIndex).trim();

        // Cleanup description
        description = description
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .replace(/^\s*[\-\*]\s*/, '') // Remove leading bullets
            .replace(/\d{2}\/\d{2}/g, '') // Remove accidentally captured dates
            .replace('Purchase', '')
            .trim();

        // Skip really short descriptions or header-like lines
        if (description.length < 3) continue;

        const isCredit = amountStr.startsWith('-') ||
            l.toLowerCase().includes('payment received') ||
            l.toLowerCase().includes('credit') ||
            l.toLowerCase().includes('deposit');

        transactions.push({
            date: formatDate(dateMatch[0]),
            description,
            amount: Math.abs(amount),
            type: isCredit ? 'credit' : 'debit',
            category: categorizeTransaction(description)
        });
    }

    return transactions;
}

function deduplicateTransactions(transactions) {
    const unique = [];
    const seen = new Set();
    for (const tx of transactions) {
        // Create a unique key
        const key = `${tx.date}-${tx.amount.toFixed(2)}-${tx.description.substring(0, 15)}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(tx);
        }
    }
    return unique;
}

function formatDate(dateStr) {
    // Handle MM/DD (assume current year) or MM/DD/YYYY
    const parts = dateStr.split(/[\/\-]/);

    let year = new Date().getFullYear();
    let month = 1;
    let day = 1;

    if (parts.length === 2) {
        // MM/DD
        month = parseInt(parts[0]);
        day = parseInt(parts[1]);
        // Adjust for year rollover? Assume if month > current month, it's last year
        if (month > (new Date().getMonth() + 1)) {
            year = year - 1;
        }
    } else if (parts.length === 3) {
        month = parseInt(parts[0]);
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
        if (year < 100) year += 2000;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

module.exports = { parsePDFStatement };
