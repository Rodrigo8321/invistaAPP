export function getPortfolioStats({ portfolio, realPrices, exchangeRate }) {
  // Prepare adjusted prices in BRL for calculations
  const adjustedPrices = {};
  portfolio.forEach(asset => {
    const realPrice = realPrices[asset.ticker];
    const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
    adjustedPrices[asset.ticker] = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
  });

  let totalCurrent = 0;
  let totalInvested = 0;
  let totalMonthlyDividends = 0;
  let totalStocks = 0;
  let totalCrypto = 0;
  let totalInvestedUSD = 0;
  let dailyProfitBRL = 0;

  const uniqueTickers = new Set();

  portfolio.forEach(asset => {
    const currentPrice = adjustedPrices[asset.ticker];
    const invested = asset.totalInvested || 0;
    const current = asset.quantity * currentPrice;

    totalCurrent += current;
    totalInvested += invested;
    totalMonthlyDividends += asset.monthlyDividends || 0;

    if (asset.type === 'Crypto') {
      totalCrypto += current;
    } else {
      totalStocks += current;
    }

    // Sum invested in USD for stocks, REITs, ETFs
    if (asset.currency === 'USD' && ['Stock', 'REIT', 'ETF'].includes(asset.type)) {
      totalInvestedUSD += invested;
      // Calcula a variação diária em BRL para ativos em USD
      const realPrice = realPrices[asset.ticker];
      const dailyChange = realPrice?.change || 0;
      dailyProfitBRL += dailyChange * asset.quantity * exchangeRate;
    }

    uniqueTickers.add(asset.ticker);
  });

  const profit = totalCurrent - totalInvested;
  const profitabilityPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return {
    totalCurrent,
    totalInvested,
    profit,
    profitabilityPercent,
    diversificationCount: uniqueTickers.size,
    totalMonthlyDividends,
    stocksPercent: totalCurrent > 0 ? (totalStocks / totalCurrent) * 100 : 0,
    cryptoPercent: totalCurrent > 0 ? (totalCrypto / totalCurrent) * 100 : 0,
    investedUSD: totalInvestedUSD,
    dailyProfitBRL,
  };
}
