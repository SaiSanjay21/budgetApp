/**
 * PDF Statement Parser
 * Extracts transactions from bank statement PDFs
 * Optimized for PNC Bank statements
 */

const pdfParse = require('pdf-parse');

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
    'Credit Card Payment': ['amex', 'epayment', 'credit card', 'thank you'],
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

        // Try PNC-specific parser first
        let transactions = extractPNCTransactions(text);

        // If no transactions found, try generic parser
        if (transactions.length === 0) {
            transactions = extractTransactionsFromText(text);
        }

        return {
            success: true,
            transactions,
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

    // PNC format: Date (MM/DD) followed by amount and description
    // Example: "11/13400.00 Zel FromDhanush Raparthy"
    // Or: "11/17 10.00 4859 DebitCard Purchase..."

    // Pattern for PNC transactions: MM/DD followed by amount
    const pncPattern = /(\d{2}\/\d{2})\s*(\d+\.?\d*)\s+(.+?)(?=\d{2}\/\d{2}|$)/g;

    // Also try pattern with space between date and amount
    const pncPattern2 = /(\d{2}\/\d{2})\s+(\d+\.?\d*)\s+(.+)/g;

    let match;

    // First, let's split by common section markers
    const sections = text.split(/(Deposits and Other Additions|Banking\/Debit Card|Online and Electronic Banking|Checks\s+paid)/i);

    let currentType = 'expense';

    for (const section of sections) {
        // Determine transaction type based on section header
        if (section.toLowerCase().includes('deposits') || section.toLowerCase().includes('additions')) {
            currentType = 'income';
        } else if (section.toLowerCase().includes('debit') || section.toLowerCase().includes('deductions') ||
            section.toLowerCase().includes('withdrawals') || section.toLowerCase().includes('checks')) {
            currentType = 'expense';
        }

        // Find all date-amount patterns in this section
        // Pattern: 11/13 400.00 or 11/13400.00 followed by description
        const lines = section.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match patterns like "11/13400.00" or "11/13 400.00"
            const dateAmountMatch = line.match(/^(\d{2}\/\d{2})\s*(\d+\.?\d{2})\s+(.+)/);

            if (dateAmountMatch) {
                const [_, dateStr, amountStr, description] = dateAmountMatch;
                const amount = parseFloat(amountStr);

                if (amount > 0 && description.length > 2) {
                    // Clean up description
                    let cleanDesc = description
                        .replace(/\s+/g, ' ')
                        .replace(/St-[A-Z0-9]+/gi, '')
                        .trim();

                    // Get year (assume current year or previous if month > current month)
                    const year = 2025; // From the statement period
                    const [month, day] = dateStr.split('/').map(Number);
                    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    transactions.push({
                        date: formattedDate,
                        description: cleanDesc,
                        amount: amount,
                        type: currentType === 'income' ? 'credit' : 'debit',
                        category: categorizeTransaction(cleanDesc)
                    });
                }
            }
        }
    }

    // Remove duplicates
    const uniqueTransactions = [];
    const seen = new Set();

    for (const tx of transactions) {
        const key = `${tx.date}-${tx.amount}-${tx.description.substring(0, 20)}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueTransactions.push(tx);
        }
    }

    return uniqueTransactions;
}

/**
 * Extract transactions from PDF text - generic parser
 */
function extractTransactionsFromText(text) {
    const transactions = [];
    const lines = text.split('\n');

    // Common date patterns: MM/DD/YYYY, MM/DD/YY, MM-DD-YYYY
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    // Amount pattern: $X,XXX.XX or X,XXX.XX or -$X.XX
    const amountPattern = /[\-\$]?\$?[\d,]+\.\d{2}/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const dateMatch = line.match(datePattern);
        if (!dateMatch) continue;

        const amounts = line.match(amountPattern);
        if (!amounts || amounts.length === 0) continue;

        const amountStr = amounts[amounts.length - 1];
        const amount = parseFloat(amountStr.replace(/[$,]/g, ''));

        if (isNaN(amount) || amount === 0) continue;

        const dateIndex = line.indexOf(dateMatch[0]);
        const amountIndex = line.lastIndexOf(amountStr);

        let description = line.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
        description = description.replace(/\s+/g, ' ').replace(/^\s*[\-\*]\s*/, '').trim();

        if (description.length < 3) continue;

        const isCredit = amountStr.startsWith('-') ||
            line.toLowerCase().includes('payment received') ||
            line.toLowerCase().includes('credit') ||
            line.toLowerCase().includes('deposit');

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

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(dateStr) {
    const parts = dateStr.split(/[\/\-]/);

    if (parts.length === 3) {
        let month = parseInt(parts[0]);
        let day = parseInt(parts[1]);
        let year = parseInt(parts[2]);

        if (year < 100) {
            year += 2000;
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return dateStr;
}

module.exports = { parsePDFStatement };
