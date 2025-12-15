export function getFilteredPortfolioStats(filteredAssets, prices) {
  const totalInvested = filteredAssets.reduce((sum, a) => sum + a.invested, 0);
  const totalCurrent = filteredAssets.reduce((sum, a) => sum + a.current, 0);
  const totalProfit = totalCurrent - totalInvested;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return {
    count: filteredAssets.length,
    invested: totalInvested,
    current: totalCurrent,
    profit: totalProfit,
    profitPercent,
  };
}
