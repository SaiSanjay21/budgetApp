const puppeteer = require('puppeteer');
const fs = require('fs');

const COOKIES_PATH = '/Users/saisanjaybandarupalli/Documents/puppeteer-test/perplexity-cookies.json';
const COMET_PATH = '/Applications/Comet.app/Contents/MacOS/Comet';

(async () => {
    console.log('🔵 Launching Comet for One-Time Login...');
    console.log('------------------------------------------------');

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: COMET_PATH,
        defaultViewport: null,
        args: ['--start-maximized'] // maximize to make it easier for user
    });

    const page = await browser.newPage();
    await page.goto('https://www.perplexity.ai/login', { waitUntil: 'domcontentloaded' });

    console.log('👉 ACTION REQUIRED: Please log in to Perplexity manually in the browser window.');
    console.log('⏳ Waiting up to 3 minutes for you to complete login...');

    try {
        console.log('⏳ Waiting for you to log in...');
        console.log('   (Script blindly saves ALL cookies every 5 seconds)');

        let attempts = 0;
        const maxAttempts = 60; // 5 minutes approx

        while (attempts < maxAttempts) {
            const cookies = await page.cookies();

            if (cookies.length > 0) {
                fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
                console.log(`💾 Saved ${cookies.length} cookies (Attempt ${attempts + 1}/${maxAttempts})`);

                // Check if we have the specific session token just for logging, but don't stop
                const sessionCookie = cookies.find(c => c.name.startsWith('__Secure-next-auth'));
                if (sessionCookie) {
                    console.log('   ✅ Valid Session Token seen in dump!');
                }
            }

            await new Promise(r => setTimeout(r, 5000));
            attempts++;
        }

    } catch (e) {
        console.log('❌ Error:', e.message);
    } finally {
        await browser.close();
    }
})();
