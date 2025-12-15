// src/domain/portfolio/portfolioStats.js

export function getPortfolioStats({ portfolio, prices }) {
  let totalCurrent = 0;
  let totalInvested = 0;
  let totalMonthlyDividends = 0;

  const uniqueTickers = new Set();

  portfolio.forEach(asset => {
    const currentPrice = prices?.[asset.ticker] ?? 0;

    totalCurrent += asset.quantity * currentPrice;
    totalInvested += asset.totalInvested || 0;
    totalMonthlyDividends += asset.monthlyDividends || 0;

    uniqueTickers.add(asset.ticker);
  });

  const profit = totalCurrent - totalInvested;

  const profitabilityPercent =
    totalInvested > 0
      ? (profit / totalInvested) * 100
      : 0;

  return {
    totalCurrent,
    totalInvested,
    profit,
    profitabilityPercent,
    diversificationCount: uniqueTickers.size,
    totalMonthlyDividends,
  };
}
