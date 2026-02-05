const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

const COOKIES_PATH = '/Users/saisanjaybandarupalli/Documents/puppeteer-test/perplexity-cookies.json';
const COMET_PATH = '/Applications/Comet.app/Contents/MacOS/Comet';

(async () => {
    console.log('🔵 Launching Comet for Perplexity Login Setup...');
    console.log('------------------------------------------------');

    // Ensure directory exists
    const dir = COOKIES_PATH.substring(0, COOKIES_PATH.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: COMET_PATH,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    });

    const page = await browser.newPage();

    console.log('👉 ACTION REQUIRED: The browser has opened.');
    console.log('1. Go to the Comet window.');
    console.log('2. Log in to Perplexity (using Google, Email, etc).');
    console.log('3. Wait for the home page to load completely.');
    console.log('4. Come back here and press ENTER to save the session.');

    // Navigate to login/home
    await page.goto('https://www.perplexity.ai/', { waitUntil: 'domcontentloaded' });

    // Create readline interface to wait for user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await new Promise(resolve => {
        rl.question('\nHit ENTER when you are successfully logged in > ', (answer) => {
            resolve();
            rl.close();
        });
    });

    console.log('⏳ Capturing cookies...');
    const cookies = await page.cookies();

    const sessionCookie = cookies.find(c => c.name.startsWith('__Secure-next-auth'));
    if (sessionCookie) {
        console.log('✅ Session token found!');
    } else {
        console.log('⚠️ Warning: Specific session token not found. Saving all cookies anyway.');
    }

    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log('------------------------------------------------');
    console.log(`💾 SAVED ${cookies.length} cookies to:`);
    console.log(`   ${COOKIES_PATH}`);
    console.log('------------------------------------------------');
    console.log('✅ Setup Complete. The application can now use this session.');

    await browser.close();
    process.exit(0);
})();
