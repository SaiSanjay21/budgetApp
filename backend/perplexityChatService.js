/**
 * Perplexity Chat Automation Service
 * Uses Puppeteer + Comet browser to interact with Perplexity AI
 * Relies on pre-saved session cookies from setup_perplexity_session.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// ===== CONFIGURATION =====
const PERPLEXITY_URL = 'https://www.perplexity.ai/';
const COMET_PATH = '/Applications/Comet.app/Contents/MacOS/Comet';
const COOKIES_PATH = '/Users/saisanjaybandarupalli/Documents/puppeteer-test/perplexity-cookies.json';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadCookies(page) {
    try {
        if (fs.existsSync(COOKIES_PATH)) {
            const cookiesString = fs.readFileSync(COOKIES_PATH, 'utf8');
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
            console.log(`✓ Loaded ${cookies.length} cookies from session file.`);
            return true;
        } else {
            console.log('⚠️ No cookies file found. Run setup_perplexity_session.js first.');
            return false;
        }
    } catch (e) {
        console.log('❌ Error loading cookies:', e.message);
        return false;
    }
}

async function dismissOverlays(page) {
    try {
        await page.keyboard.press('Escape');
        await delay(300);
    } catch (e) { }
}

async function sendMessage(page, message) {
    await dismissOverlays(page);

    console.log('📝 Finding input area...');

    // Try multiple selectors for the input area
    const inputSelectors = [
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Follow"]',
        'textarea',
        '[contenteditable="true"]',
        'input[type="text"]'
    ];

    let inputFound = false;

    for (const selector of inputSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 3000 });
            await page.click(selector);
            inputFound = true;
            console.log(`✓ Found input with selector: ${selector}`);
            break;
        } catch (e) {
            // Try next selector
        }
    }

    if (!inputFound) {
        console.log('⚠️ Could not find input, trying Tab navigation...');
        await page.keyboard.press('Tab');
        await delay(200);
        await page.keyboard.press('Tab');
    }

    await delay(500);

    console.log('⌨️ Typing message...');
    await page.keyboard.type(message, { delay: 5 });

    await delay(1000);
    console.log('⏎ Sending message...');
    await page.keyboard.press('Enter');

    await delay(3000);
}

async function waitForResponse(page, timeoutMs = 180000) {
    console.log('⏳ Waiting for Perplexity response...');
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        // Check if still generating (look for stop button or loading indicators)
        const isGenerating = await page.evaluate(() => {
            const stopBtn = document.querySelector('button[aria-label*="Stop"]');
            const loadingSpinner = document.querySelector('[class*="loading"], [class*="spinner"]');
            return (stopBtn && stopBtn.offsetParent !== null) || loadingSpinner;
        });

        if (!isGenerating) {
            // Verify we have actual content
            const hasContent = await page.evaluate(() => {
                const proseElements = document.querySelectorAll('[class*="prose"]');
                return proseElements.length > 0;
            });

            if (hasContent) {
                console.log('✓ Response complete!');
                await delay(2000); // Let it fully render
                return true;
            }
        }

        await delay(1000);
    }

    console.log('⚠️ Response timeout');
    return false;
}

async function getLastResponse(page) {
    return await page.evaluate(() => {
        // Try multiple selectors to find the response
        const selectors = [
            '[class*="prose"]',
            '[class*="answer"]',
            '[class*="response"]',
            '[role="article"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // Get the last (most recent) response
                const lastElement = elements[elements.length - 1];
                const text = lastElement.innerText || lastElement.textContent;
                if (text && text.length > 50) {
                    return text;
                }
            }
        }

        return null;
    });
}

function extractJSON(text) {
    if (!text) return null;

    // Find JSON object in the text
    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
        return null;
    }

    let jsonText = text.substring(jsonStart, jsonEnd + 1);

    // Clean up common formatting issues
    jsonText = jsonText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        .replace(/[\u201C\u201D]/g, '"')  // Smart quotes
        .replace(/[\u2018\u2019]/g, "'");

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error('❌ JSON Parse Error:', e.message);
        return null;
    }
}

/**
 * Main function to send a prompt to Perplexity and get a response
 * @param {string} prompt - The prompt/question to send
 * @returns {Promise<{success: boolean, response?: string, data?: object, error?: string}>}
 */
async function askPerplexity(prompt) {
    let browser;

    try {
        console.log('🚀 Launching Perplexity Automation...');

        browser = await puppeteer.launch({
            headless: false,
            executablePath: COMET_PATH,
            defaultViewport: { width: 1400, height: 900 },
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });

        const page = await browser.newPage();

        // Load saved session cookies
        const cookiesLoaded = await loadCookies(page);
        if (!cookiesLoaded) {
            throw new Error('Session cookies not found. Run setup_perplexity_session.js first.');
        }

        // Navigate to Perplexity
        console.log('🌐 Navigating to Perplexity...');
        await page.goto(PERPLEXITY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(5000);

        // Check login status
        const isLoggedIn = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const loginBtn = buttons.find(b => {
                const text = b.innerText || b.textContent || '';
                return text.includes('Log in') || text.includes('Sign up');
            });
            return !loginBtn;
        });

        console.log(isLoggedIn ? '✓ Session active (Logged In)' : '⚠️ Not logged in - session may have expired');

        if (!isLoggedIn) {
            throw new Error('Session expired. Please run setup_perplexity_session.js to refresh.');
        }

        // Send the prompt
        await sendMessage(page, prompt);

        // Wait for response
        const responseReceived = await waitForResponse(page);

        if (!responseReceived) {
            throw new Error('Timeout waiting for Perplexity response');
        }

        // Get the response text
        const responseText = await getLastResponse(page);

        if (!responseText) {
            throw new Error('Could not extract response from page');
        }

        console.log('✓ Response captured successfully!');

        // Try to extract JSON if present
        const jsonData = extractJSON(responseText);

        await browser.close();

        return {
            success: true,
            response: responseText,
            data: jsonData // Will be null if no valid JSON found
        };

    } catch (error) {
        console.error('❌ Perplexity Automation Error:', error.message);
        if (browser) await browser.close();
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Specialized function for parsing bank statements
 * @param {string} statementText - Raw text from PDF statement
 * @returns {Promise<{success: boolean, bankName?: string, transactions?: Array, error?: string}>}
 */
async function parseStatementWithPerplexity(statementText) {
    const prompt = `You are a precise financial data extraction engine. 
Extract ALL bank transactions from the following bank statement text.
The text may span multiple pages, so ignore page headers, footers, and page numbers.

IMPORTANT: Return ONLY a valid JSON object. No markdown, no explanation, no code blocks.
Start your response with { and end with }

The JSON must match this structure:
{
    "bankName": "Detected Bank Name or 'Unknown Bank'",
    "transactions": [
        {
            "date": "YYYY-MM-DD",
            "description": "Clean merchant name or description",
            "amount": 123.45,
            "type": "debit",
            "category": "Miscellaneous"
        }
    ]
}

Rules:
1. Convert all dates to YYYY-MM-DD format. Assume the current year ${new Date().getFullYear()} if year is missing.
2. "Payments" or "Deposits" are type 'credit'. "Purchases" or "Withdrawals" are type 'debit'.
3. Ignore running balance lines, APR lines, and fee summaries.
4. amount should always be a positive number.
5. Extract EVERY valid transaction found.

Statement Text:
${statementText.substring(0, 20000)}`;

    const result = await askPerplexity(prompt);

    // Debug logging
    console.log('--- Perplexity Result Debug ---');
    console.log('Success:', result.success);
    console.log('Has response:', !!result.response);
    console.log('Response length:', result.response?.length || 0);
    console.log('Has parsed data:', !!result.data);

    if (result.response && !result.data) {
        console.log('Raw response (first 500 chars):', result.response.substring(0, 500));
    }

    if (result.data) {
        console.log('Bank Name:', result.data.bankName);
        console.log('Transaction count:', result.data.transactions?.length || 0);
    }
    console.log('--- End Debug ---');

    if (result.success && result.data && result.data.transactions && result.data.transactions.length > 0) {
        return {
            success: true,
            bankName: result.data.bankName || 'Unknown Bank',
            transactions: result.data.transactions
        };
    } else {
        return {
            success: false,
            error: result.error || 'Failed to parse statement - no valid transactions extracted'
        };
    }
}

module.exports = {
    askPerplexity,
    parseStatementWithPerplexity
};
