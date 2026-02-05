const { parseStatementWithPerplexity } = require('./perplexityService');

const TEST_STATEMENT = `
PNC Bank Statement - Test Run
Account Number: 123456789
Date Description Amount
01/15/2026 Starbucks Coffee $12.50
01/16/2026 Target Store $45.20
01/17/2026 Uber Trip $15.00
`;

(async () => {
    console.log('🧪 Starting Standalone Comet/Perplexity Test...');
    console.log('------------------------------------------------');
    console.log('This script will attempt to:');
    console.log('1. Launch Comet Browser');
    console.log('2. Check for Perplexity Interface');
    console.log('3. Extract data from a small 3-line test statement');
    console.log('------------------------------------------------');

    try {
        const result = await parseStatementWithPerplexity(TEST_STATEMENT);

        console.log('------------------------------------------------');
        if (result.success) {
            console.log('✅ TEST SUCCEEDED!');
            console.log('Extracted Data:', JSON.stringify(result.data, null, 2));
        } else {
            console.log('❌ TEST FAILED');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('💥 CRITICAL FAILURE:', error);
    }
})();
