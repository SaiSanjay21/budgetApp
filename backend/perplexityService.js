const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
            console.log(`Loaded ${cookies.length} cookies from file.`);
            return true;
        }
    } catch (e) {
        console.log('Error loading cookies:', e.message);
    }
    return false;
}

async function saveCookies(page) {
    try {
        const cookies = await page.cookies();
        fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
        console.log(`Saved ${cookies.length} cookies to file.`);
    } catch (e) {
        console.log('Error saving cookies:', e.message);
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
    try {
        console.log('Finding input area...');

        // Broader selector strategy
        const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';

        // Wait briefly - if it fails, we fall back to blind typing
        try {
            await page.waitForSelector(inputSelector, { timeout: 5000 });
            await page.click(inputSelector);
        } catch (e) {
            console.log('Selector wait failed, trying to tab into input...');
            // Fallback: Press Tab a few times to try and hit the input
            // Usually valid on a default "Ask anything..." page
            await page.keyboard.press('Tab');
            await delay(200);
            await page.keyboard.press('Tab');
        }

        await delay(500);

        // Paste method (more reliable for long text)
        // We bypass setting specific element value and just "type" into whatever is focused
        console.log('Typing prompt...');

        // Type the first bit
        await page.keyboard.type(message.substring(0, 10));

        // Then paste the rest if possible, or just type it all if clipboard access issues
        // For simplicity/reliability, we'll type it but fast
        // Actually, Puppeteer type is reliable.
        await page.keyboard.type(message.substring(10), { delay: 0 });

        // Ensure "Enter" is pressed to send
        await delay(1000);
        console.log('Pressing Enter...');
        await page.keyboard.press('Enter');

        // Wait for generation to start
        await delay(2000);
    } catch (e) {
        console.error('Error sending message:', e);
        throw e;
    }
}

async function waitForResponse(page, timeoutMs = 120000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const isGenerating = await page.evaluate(() => {
            // "Stop generating" button usually indicates active request
            const stopBtn = document.querySelector('button[aria-label*="Stop"]');
            return stopBtn && stopBtn.offsetParent !== null;
        });

        // If not generating, maybe check if answer exists? 
        // But initially it's not generating before it starts.
        // We waited 2s in sendMessage, so it should be generating or done.

        if (!isGenerating) {
            // Double check if we actually have an answer
            const hasAnswer = await page.evaluate(() => {
                const answers = document.querySelectorAll('[class*="prose"]');
                return answers.length > 0;
            });

            if (hasAnswer) {
                await delay(2000); // Settle time
                return true;
            }
        }

        await delay(1000);
    }

    return false;
}

async function getLastResponse(page) {
    return await page.evaluate(() => {
        // Perplexity structure changes, checking common selectors
        const elements = Array.from(document.querySelectorAll('[class*="prose"]'));
        if (elements.length > 0) {
            // Get the last one
            return elements[elements.length - 1].innerText;
        }
        return null;
    });
}

function extractJSON(text) {
    if (!text) return null;

    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
        return null;
    }

    let jsonText = text.substring(jsonStart, jsonEnd + 1);

    // Clean up markdown code blocks if any
    jsonText = jsonText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        // smart quotes cleanup
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error('JSON Parse Error:', e);
        return null;
    }
}

/**
 * Main function to parse statement using Perplexity
 */
async function parseStatementWithPerplexity(text) {
    let browser;
    try {
        console.log('🚀 Launching Perplexity Browser Automation...');

        browser = await puppeteer.launch({
            headless: false, // User requested browser usage, visible might be better or required for Comet
            executablePath: COMET_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ],
            defaultViewport: { width: 1400, height: 900 }
        });

        const page = await browser.newPage();

        const cookiesLoaded = await loadCookies(page);
        console.log(cookiesLoaded ? '✓ Cookies loaded' : '⚠️ No cookies found, manual login might be needed');

        // Puppeteer launches with a blank page, so we MUST navigate to the URL.
        // Even if Comet defaults to it, Puppeteer's control session starts empty.
        console.log('Navigating to Perplexity...');
        await page.goto(PERPLEXITY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(5000);

        // Check if we are actually logged in
        const isLoggedIn = await page.evaluate(() => {
            // Perplexity usually shows "Sign Up" or "Log In" buttons if guest
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const loginBtn = buttons.find(b => b.innerText.includes('Log in') || b.innerText.includes('Sign up'));
            return !loginBtn;
        });

        console.log(isLoggedIn ? '✓ Session active (Logged In)' : '⚠️ Warning: Appears to be logged out. Cookies might be invalid or expired.');

        const prompt = `
            You are a precise financial data extraction engine. 
            Extract ALL bank transactions from the following bank statement text.
            The text may span multiple pages, so ignore page headers, footers, and page numbers.
            
            Return ONLY a valid, parseable JSON object (no markdown formatting code blocks).
            The JSON must match this structure:
            {
                "bankName": "Detected Bank Name or 'Unknown Bank'",
                "transactions": [
                    {
                        "date": "YYYY-MM-DD",
                        "description": "Clean merchant name or description",
                        "amount": 123.45 (positive number),
                        "type": "debit" (for spending) or "credit" (for payments/deposits),
                        "category": "Groceries" | "Dining" | "Utilities" | "Transportation" | "Shopping" | "Entertainment" | "Healthcare" | "Subscriptions" | "Credit Card Payment" | "Savings Transfer" | "Miscellaneous"
                    }
                ]
            }

            Rules:
            1. Convert all dates to YYYY-MM-DD format. Assume the current year ${new Date().getFullYear()} if year is missing.
            2. "Payments" or "Deposits" are type 'credit'. "Purchases" or "Withdrawals" are type 'debit'.
            3. Ignore running balance lines.
            4. Extract EVERY valid transaction found.

            Statement Text:
            ${text.substring(0, 25000)} 
        `;

        console.log('Step 1: Sending prompt to Perplexity...');
        await sendMessage(page, prompt);

        console.log('Step 2: Waiting for response...');
        const responseSuccess = await waitForResponse(page);

        if (!responseSuccess) {
            throw new Error('Timeout waiting for Perplexity response');
        }

        const responseText = await getLastResponse(page);
        console.log('✓ Response received, extracting JSON...');

        const data = extractJSON(responseText);

        if (!data) {
            console.error('Raw response:', responseText);
            throw new Error('Failed to parse JSON from response');
        }

        // Removed saveCookies to avoid overwriting valid session with potential guest cookies
        // await saveCookies(page);

        await browser.close();
        return { success: true, data };

    } catch (error) {
        console.error('Perplexity Automation Error:', error);
        if (browser) await browser.close();
        return { success: false, error: error.message };
    }
}

module.exports = { parseStatementWithPerplexity };
