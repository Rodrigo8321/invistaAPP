/**
 * Calcula totais de transações
 * @param {Array} transactions - Array de transações
 * @returns {Object} Objeto com totais
 */
export function calculateTotals(transactions) {
  let totalBought = 0;
  let totalSold = 0;
  let totalProfit = 0;
  let realizedProfitFromSales = 0; // ✅ ADICIONADO: Rastreia o lucro apenas das vendas

  transactions.forEach(transaction => {
    const total = transaction.quantity * transaction.unitPrice;

    if (transaction.type === 'Compra') {
      totalBought += total;
    } else if (transaction.type === 'Venda') {
      totalSold += total;
      realizedProfitFromSales += transaction.profit || 0; // ✅ ADICIONADO: Acumula o lucro das vendas
    }
  });

  // ✅ CORREÇÃO: O lucro total agora é a soma do lucro realizado com as vendas
  // mais a diferença entre o valor atual e o custo dos ativos restantes.
  // Esta lógica foi movida para as telas (Dashboard/Portfolio) que têm
  // acesso aos preços atuais para um cálculo mais preciso.
  totalProfit = realizedProfitFromSales;

  const profitPercent = totalBought > 0 ? (totalProfit / totalBought) * 100 : 0;

  return {
    totalBought,
    totalSold,
    totalProfit,
    profitPercent,
  };
}

/**
 * Calcula o estado do portfólio a partir de uma lista de transações.
 * @param {Array} transactions - Array de todas as transações.
 * @returns {Array} Um array de ativos que representa o portfólio.
 */
export function calculatePortfolioFromTransactions(transactions) {
  const portfolioMap = new Map();

  // Ordena as transações por data para garantir a ordem correta dos cálculos
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Adiciona log para depurar tickers com espaços extras
  console.log('🔍 Símbolos originais nas transações:', sortedTransactions.map(t => `"${t.ticker}"`));

  sortedTransactions.forEach(tx => {
    // Limpa o ticker para remover espaços e garantir consistência
    const cleanTicker = tx.ticker.trim().toUpperCase();
    if (!portfolioMap.has(cleanTicker)) {
      // Se o ativo não existe no mapa, inicializa com dados da primeira transação
      // Isso é importante para carregar metadados como nome, tipo, setor, etc.
      portfolioMap.set(cleanTicker, {
        id: cleanTicker, // Usar ticker como ID único para o ativo no portfólio
        ticker: cleanTicker,
        name: tx.name,
        type: tx.typeAsset || 'Ação', // Garante que o tipo nunca seja indefinido
        sector: tx.sector,
        country: tx.country,
        currency: tx.currency,
        quantity: 0,
        averagePrice: 0,
        totalInvested: 0,
        currentPrice: tx.unitPrice, // Preço inicial, será atualizado por APIs externas
      });
    }

    const asset = portfolioMap.get(cleanTicker);

    if (tx.type === 'Compra') {
      const newTotalInvested = asset.totalInvested + (tx.quantity * tx.unitPrice);
      const newQuantity = asset.quantity + tx.quantity;
      asset.quantity = newQuantity;
      asset.totalInvested = newTotalInvested;
      asset.averagePrice = newQuantity > 0 ? newTotalInvested / newQuantity : 0;
    } else if (tx.type === 'Venda') {
      // ✅ CORREÇÃO: O custo das ações vendidas deve ser baseado no preço médio de compra,
      // e não no preço de venda. Isso garante que o `totalInvested` reflita o custo
      // dos ativos que ainda estão na carteira.
      const costOfSoldShares = tx.quantity * asset.averagePrice;
      asset.totalInvested = Math.max(0, asset.totalInvested - costOfSoldShares); // Garante que não fique negativo
      asset.quantity -= tx.quantity;

      if (asset.quantity <= 0) {
        asset.averagePrice = 0;
        asset.totalInvested = 0;
      }
    }
  });

  // Retorna apenas os ativos que o usuário ainda possui (quantidade > 0)
  return Array.from(portfolioMap.values()).filter(asset => asset.quantity > 0);
}
