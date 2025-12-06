const { fetchExchangeRate, fetchQuote, testFindTicker } = require('./src/services/marketService');

// Test fetchExchangeRate
async function testExchangeRate() {
  try {
    console.log('Testing fetchExchangeRate...');
    const rate = await fetchExchangeRate();
    console.log('✅ fetchExchangeRate success:', rate);
  } catch (error) {
    console.error('❌ fetchExchangeRate failed:', error.message);
  }
}

// Test fetchQuote with valid ticker
async function testValidQuote() {
  try {
    console.log('Testing fetchQuote with PETR4...');
    const asset = { ticker: 'PETR4', type: 'Ação' };
    const quote = await fetchQuote(asset);
    console.log('✅ fetchQuote success for PETR4:', quote.price);
  } catch (error) {
    console.error('❌ fetchQuote failed for PETR4:', error.message);
  }
}

// Test fetchQuote with invalid ticker
async function testInvalidQuote() {
  try {
    console.log('Testing fetchQuote with BBSE3...');
    const asset = { ticker: 'BBSE3', type: 'Ação' };
    const quote = await fetchQuote(asset);
    console.log('✅ fetchQuote success for BBSE3 (mock):', quote.price);
  } catch (error) {
    console.error('❌ fetchQuote failed for BBSE3:', error.message);
  }
}

async function testFindTickerFunction() {
  try {
    console.log('Testing findTicker with BBSE3...');
    await testFindTicker();
  } catch (error) {
    console.error('❌ findTicker failed for BBSE3:', error.message);
  }
}

async function runTests() {
  // await testExchangeRate();
  // await testValidQuote();
  // await testInvalidQuote();
  await testFindTickerFunction();
}

runTests();
