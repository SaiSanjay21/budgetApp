/**
 * Test script for Perplexity Chat Automation
 * Run this to verify the chat automation is working correctly
 */

const { askPerplexity, parseStatementWithPerplexity } = require('./perplexityChatService');

// Simple test prompt
const TEST_PROMPT = 'What is 2 + 2? Reply with just the number.';

// Test bank statement for PDF parsing
const TEST_STATEMENT = `
PNC Bank Statement
Account: Checking ****1234
Statement Period: January 1-31, 2026

Date        Description                  Amount
01/05       STARBUCKS COFFEE             $12.50
01/08       WALMART SUPERCENTER          $156.32
01/10       UBER TRIP                    $24.00
01/15       AMAZON PRIME                 $14.99
01/20       DIRECT DEPOSIT PAYROLL       $3,500.00
01/22       CHIPOTLE MEXICAN GRILL       $18.75
`;

async function runTests() {
    console.log('═══════════════════════════════════════════');
    console.log('   PERPLEXITY CHAT AUTOMATION TEST SUITE   ');
    console.log('═══════════════════════════════════════════');
    console.log('');

    // Test 1: Simple question
    console.log('📋 TEST 1: Simple Question');
    console.log('──────────────────────────');
    console.log(`Prompt: "${TEST_PROMPT}"`);
    console.log('');

    const test1 = await askPerplexity(TEST_PROMPT);

    if (test1.success) {
        console.log('✅ TEST 1 PASSED');
        console.log('Response:', test1.response?.substring(0, 200) + '...');
    } else {
        console.log('❌ TEST 1 FAILED');
        console.log('Error:', test1.error);
    }

    console.log('');
    console.log('──────────────────────────');

    // Wait a bit before next test
    await new Promise(r => setTimeout(r, 3000));

    // Test 2: Bank statement parsing
    console.log('📋 TEST 2: Bank Statement Parsing');
    console.log('──────────────────────────');
    console.log('Sending test bank statement...');
    console.log('');

    const test2 = await parseStatementWithPerplexity(TEST_STATEMENT);

    if (test2.success) {
        console.log('✅ TEST 2 PASSED');
        console.log('Bank Name:', test2.bankName);
        console.log('Transactions Found:', test2.transactions?.length || 0);
        if (test2.transactions && test2.transactions.length > 0) {
            console.log('Sample Transaction:', JSON.stringify(test2.transactions[0], null, 2));
        }
    } else {
        console.log('❌ TEST 2 FAILED');
        console.log('Error:', test2.error);
    }

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('           TEST SUITE COMPLETE             ');
    console.log('═══════════════════════════════════════════');
}

runTests().catch(console.error);
