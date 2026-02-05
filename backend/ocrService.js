const Tesseract = require('tesseract.js');
const { parsePDFStatement } = require('./pdfParser');

/**
 * Extract data from receipt image or PDF
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 */
async function parseReceipt(fileBuffer, mimeType) {
    try {
        let text = '';

        if (mimeType === 'application/pdf') {
            const pdfResult = await parsePDFStatement(fileBuffer);
            if (pdfResult.success) {
                // If PDF parser returns structured transactions, return the first one
                // or try to find the "Total" if it's a single receipt PDF
                if (pdfResult.transactions.length > 0) {
                    // Heuristic: Return the one with largest amount or most likely to be the total
                    return {
                        success: true,
                        data: pdfResult.transactions[0] // Simplified for now
                    };
                }
                text = pdfResult.rawText;
            }
        } else {
            // Image OCR
            console.log('Starting OCR...');
            const result = await Tesseract.recognize(
                fileBuffer,
                'eng',
                { logger: m => console.log(m) }
            );
            text = result.data.text;
            console.log('OCR Complete. Text length:', text.length);
        }

        // Parse extracted text
        const extractedData = extractReceiptData(text);

        return {
            success: true,
            data: extractedData,
            rawText: text
        };

    } catch (error) {
        console.error('Receipt parsing error:', error);
        return { success: false, error: error.message };
    }
}

function extractReceiptData(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // 1. Find Date
    // Matches: 12/25/2023, 25-12-23, 2023.12.25, etc.
    const datePattern = /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/;
    let date = new Date().toISOString().split('T')[0]; // Default to today

    for (const line of lines) {
        const match = line.match(datePattern);
        if (match) {
            try {
                // simple parser, might need more robust dayjs/moment
                const parts = match[0].split(/[./-]/);
                // Assumption: US format MM/DD/YYYY if 3 parts
                if (parts.length === 3) {
                    // handling 2-digit years
                    if (parts[2].length === 2) parts[2] = '20' + parts[2];
                    date = new Date(parts[2], parts[0] - 1, parts[1]).toISOString().split('T')[0];
                }
                break;
            } catch (e) { }
        }
    }

    // 2. Find Amount
    // Look for lines with "Total", "Amount", "Balance"
    // Or just find the largest currency-like number
    const amountPattern = /[$]?\s?\d+[\.,]\d{2}/g;
    let maxAmount = 0;

    // Prioritize lines with relevant keywords
    const keywords = ['total', 'amount', 'balance', 'due', 'grand total'];
    let foundTotal = false;

    for (const line of lines) {
        const lower = line.toLowerCase();
        const matches = line.match(amountPattern);

        if (matches) {
            for (const match of matches) {
                const val = parseFloat(match.replace(/[^0-9.]/g, ''));
                if (!isNaN(val)) {
                    if (keywords.some(k => lower.includes(k))) {
                        // High confidence
                        if (val > maxAmount) maxAmount = val; // Usually total is the largest on "Total" line
                        foundTotal = true;
                    } else if (!foundTotal) {
                        // Keep track of largest number found so far as fallback
                        if (val > maxAmount) maxAmount = val;
                    }
                }
            }
        }
    }

    // 3. Find Merchant (Very naive: First non-empty line that isn't a date/number?)
    // Omit common header words like "Receipt", "Welcome"
    let merchant = '';
    const ignoreWords = ['receipt', 'welcome', 'table', 'guest', 'server', 'date', 'total', 'tax'];

    for (const line of lines) {
        if (line.length < 3) continue;
        if (line.match(datePattern)) continue;
        if (line.match(amountPattern)) continue;

        const lower = line.toLowerCase();
        if (ignoreWords.some(w => lower.includes(w))) continue;

        // Use first valid line as merchant
        merchant = line.replace(/[^\w\s]/gi, '').trim(); // Remove symbols
        if (merchant) break;
    }

    return {
        merchantName: merchant || 'Unknown Merchant',
        amount: maxAmount || 0,
        date: date,
        rawText: text,
        // Default category, maybe use keywords if desired
        category: 'Miscellaneous'
    };
}

module.exports = { parseReceipt };
