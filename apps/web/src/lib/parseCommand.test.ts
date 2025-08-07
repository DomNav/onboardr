// Quick tests for the enhanced natural language parser
import { parseTrade, parseMultiTrade, type ParsedTrade, type ParsedMultiTrade } from './parseCommand';

// Test cases for the natural language parser
const testCases: Array<{ input: string; expected: ParsedTrade | null }> = [
  // Standard formats
  { input: '/swap 100 XLM → USDC', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'swap 100 xlm for usdc', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'swap 50 xlm to aqua', expected: { amount: '50', sell: 'XLM', buy: 'AQUA' } },
  { input: 'sell 2500 xlm for usdc', expected: { amount: '2500', sell: 'XLM', buy: 'USDC' } },
  
  // With commas
  { input: 'swap 2,500 xlm to usdc', expected: { amount: '2500', sell: 'XLM', buy: 'USDC' } },
  { input: 'swap 1,000,000 aqua for xlm', expected: { amount: '1000000', sell: 'AQUA', buy: 'XLM' } },
  
  // Asset aliases - existing
  { input: 'swap 100 lumens for usd', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'swap 50 stellar to usdt', expected: { amount: '50', sell: 'XLM', buy: 'USDC' } },
  
  // Asset aliases - new natural language
  { input: 'swap 100 lumens for dollars', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'swap 50 bitcoin to usdc', expected: { amount: '50', sell: 'BTC', buy: 'USDC' } },
  { input: 'swap 1000 ripple for xlm', expected: { amount: '1000', sell: 'XRP', buy: 'XLM' } },
  
  // Natural language prefixes
  { input: 'I want to swap 100 xlm for usdc', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'can I swap 50 aqua to yxlm', expected: { amount: '50', sell: 'AQUA', buy: 'yXLM' } },
  { input: 'please swap 200 xlm for usdc', expected: { amount: '200', sell: 'XLM', buy: 'USDC' } },
  { input: 'let me swap 75 usdc to xlm', expected: { amount: '75', sell: 'USDC', buy: 'XLM' } },
  { input: 'I need to swap 300 xlm for aqua', expected: { amount: '300', sell: 'XLM', buy: 'AQUA' } },
  { input: "I'd like to swap 150 usdc for xlm", expected: { amount: '150', sell: 'USDC', buy: 'XLM' } },
  { input: 'could you swap 250 aqua to usdc', expected: { amount: '250', sell: 'AQUA', buy: 'USDC' } },
  
  // Conversational style
  { input: 'exchange 100 xlm to usdc', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'convert 50 usdc for xlm', expected: { amount: '50', sell: 'USDC', buy: 'XLM' } },
  { input: 'change 200 xlm into aqua', expected: { amount: '200', sell: 'XLM', buy: 'AQUA' } },
  
  // Decimal amounts
  { input: 'swap 100.5 xlm for usdc', expected: { amount: '100.5', sell: 'XLM', buy: 'USDC' } },
  
  // Different connectors
  { input: 'swap 100 xlm into usdc', expected: { amount: '100', sell: 'XLM', buy: 'USDC' } },
  { input: 'buy 100 usdc with xlm', expected: null }, // Not supported format
  
  // Invalid cases
  { input: 'invalid command', expected: null },
  { input: 'swap abc xlm for usdc', expected: null },
  { input: 'swap 100', expected: null },
  { input: '', expected: null },
  { input: 'I want to buy a coffee', expected: null }, // Not a swap command
  { input: 'hello world', expected: null },
];

// Run tests (simple console-based)
console.log('🧪 Testing Natural Language Parser');
console.log('==================================');

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }, index) => {
  const result = parseTrade(input);
  const success = JSON.stringify(result) === JSON.stringify(expected);
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: "${input}" → ${JSON.stringify(result)}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: "${input}"`);
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
  }
});

console.log('\n📊 Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

// Test cases for multiple swaps
const multiTradeTestCases: Array<{ input: string; expected: ParsedMultiTrade | null }> = [
  // Multiple swaps with "and"
  { 
    input: 'swap 100 xlm for usdc and swap 50 aqua to yxlm', 
    expected: { 
      trades: [
        { amount: '100', sell: 'XLM', buy: 'USDC' },
        { amount: '50', sell: 'AQUA', buy: 'yXLM' }
      ], 
      count: 2 
    } 
  },
  
  // Multiple swaps with "then"
  { 
    input: 'sell 1000 xlm to usdc, then swap 500 aqua for xlm', 
    expected: { 
      trades: [
        { amount: '1000', sell: 'XLM', buy: 'USDC' },
        { amount: '500', sell: 'AQUA', buy: 'XLM' }
      ], 
      count: 2 
    } 
  },
  
  // Three swaps
  { 
    input: 'swap 100 xlm for usdc and swap 50 aqua to yxlm & sell 200 usdc for xlm', 
    expected: { 
      trades: [
        { amount: '100', sell: 'XLM', buy: 'USDC' },
        { amount: '50', sell: 'AQUA', buy: 'yXLM' },
        { amount: '200', sell: 'USDC', buy: 'XLM' }
      ], 
      count: 3 
    } 
  },
  
  // Single swap (should return null)
      { input: 'swap 100 xlm for usdc', expected: null },
  
  // Natural language multiple swaps
  { 
    input: 'I want to swap 100 xlm for usdc and swap 100 aqua for xrp', 
    expected: { 
      trades: [
        { amount: '100', sell: 'XLM', buy: 'USDC' },
        { amount: '100', sell: 'AQUA', buy: 'XRP' }
      ], 
      count: 2 
    } 
  },
  
  { 
    input: 'can I trade 50 xlm to usdc and also exchange 200 aqua for yxlm', 
    expected: { 
      trades: [
        { amount: '50', sell: 'XLM', buy: 'USDC' },
        { amount: '200', sell: 'AQUA', buy: 'yXLM' }
      ], 
      count: 2 
    } 
  },
  
  // Invalid format
  { input: 'invalid and trade 100 xlm for usdc', expected: null },
];

console.log('\n🔀 Testing Multiple Trade Parser');
console.log('=================================');

let multiPassed = 0;
let multiFailed = 0;

multiTradeTestCases.forEach(({ input, expected }, index) => {
  const result = parseMultiTrade(input);
  const success = JSON.stringify(result) === JSON.stringify(expected);
  
  if (success) {
    multiPassed++;
    console.log(`✅ Multi Test ${index + 1}: "${input}" → ${result?.count || 0} trades`);
  } else {
    multiFailed++;
    console.log(`❌ Multi Test ${index + 1}: "${input}"`);
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
  }
});

console.log('\n📊 Multi-Trade Results:');
console.log(`✅ Passed: ${multiPassed}`);
console.log(`❌ Failed: ${multiFailed}`);
console.log(`📈 Success Rate: ${((multiPassed / multiTradeTestCases.length) * 100).toFixed(1)}%`);

export {};