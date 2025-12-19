/**
 * @file Este módulo contém funções de domínio para realizar cálculos de performance,
 * alocação e ranking de ativos de um portfólio.
 *
 * As funções aqui presentes são puras e recebem os dados necessários para
 * retornar informações calculadas, como:
 * - Ativos com preços e lucros atualizados em tempo real.
 * - Alocação percentual por categoria de ativo.
 * - Ranking dos melhores e piores ativos por segmento.
 */
/**
 * Combina os dados do portfólio com os preços em tempo real e calcula métricas de performance.
 * @param {Array} portfolio - Array de ativos do portfólio.
 * @param {Object} realPrices - Objeto com preços em tempo real { ticker: priceData }.
 * @param {number} exchangeRate - Taxa de câmbio USD -> BRL.
 * @returns {Array} Array de ativos com métricas calculadas.
 */
export function calculateAssetsWithRealPrices(portfolio, realPrices, exchangeRate) {
  if (!portfolio || !Array.isArray(portfolio)) {
    return [];
  }
  return portfolio.map(asset => {
    const realPrice = realPrices[asset.ticker];
    const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
    const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
    const invested = asset.totalInvested || 0;
    const current = priceInBRL * asset.quantity;
    const profit = current - invested;
    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

    return {
      ...asset,
      currentPriceReal: priceInBRL,
      profit,
      profitPercent,
      // A variação diária é usada como base para o ranking de "melhores/piores".
      // ✅ CORREÇÃO: Usar o preço atual e o preço de fechamento anterior para um cálculo de variação mais robusto,
      // já que `changePercent` pode não vir de todas as APIs.
      dailyChange:
        realPrice && realPrice.previousClose > 0
          ? ((realPrice.price - realPrice.previousClose) / realPrice.previousClose) * 100
          : realPrice?.changePercent || 0,
      isMock: realPrice?.isMock || false,
    };
  });
}

/**
 * Calcula a alocação percentual para cada tipo de ativo.
 * @param {Array} portfolio - Array de ativos do portfólio.
 * @param {Object} realPrices - Objeto com preços em tempo real { ticker: priceData }.
 * @param {number} exchangeRate - Taxa de câmbio USD -> BRL.
 * @returns {Array} Array de objetos com tipo, valor, porcentagem e label.
 */
export function calculateCategoryAllocations(portfolio, realPrices, exchangeRate) {
  const typeTotals = {};
  const filterMap = { acao: 'Ação', fii: 'FII', stock: 'Stock', reit: 'REIT', etf: 'ETF', crypto: 'Crypto' };

  if (!portfolio || !Array.isArray(portfolio)) {
    return [];
  }

  portfolio.forEach(asset => {
    const realPrice = realPrices[asset.ticker];
    const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
    const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
    const value = priceInBRL * asset.quantity;
    const key = asset.type.toLowerCase().replace('ção', 'cao');

    typeTotals[key] = (typeTotals[key] || 0) + value;
  });

  const total = Object.values(typeTotals).reduce((sum, val) => sum + val, 0);

  return Object.entries(typeTotals)
    .map(([key, value]) => ({
      type: key,
      value,
      percentage: (value / total) * 100,
      label: filterMap[key] || key,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calcula os 3 melhores e piores ativos de cada segmento com base na sua rentabilidade percentual.
 * @param {Array} assetsWithRealPrices - Array de ativos com preços e performance já calculados.
 * @returns {Object} Objeto contendo os melhores e piores ativos para cada segmento.
 */
export function calculatePerformersBySegment(assetsWithRealPrices) {
  const performers = {};

  // Filtro geral: todos os ativos do portfólio, independente do tipo.
  const allAssets = assetsWithRealPrices || [];

  // Ordena pela rentabilidade percentual (do maior para o menor).
  const sorted = allAssets.sort((a, b) => b.profitPercent - a.profitPercent);

  // Pega os 3 melhores (top 3) e os 3 piores (bottom 3).
  const top3 = sorted.slice(0, 3);
  const worst3 = sorted.length > 3 ? sorted.slice(-3).reverse() : [];

  // Adiciona ao objeto final apenas se houver ativos.
  if (top3.length > 0) {
    performers['geral'] = {
      top: top3,
      worst: worst3,
    };
  }

  return performers;
}
