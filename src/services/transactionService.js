import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = '@InvestPro:transactions';
const CLEANUP_FLAG_KEY = '@InvestPro:transactionsCleaned';

export const transactionService = {
  /**
   * Carrega todas as transações do AsyncStorage
   * @returns {Promise<Array>} Array com todas as transações
   */
  async getTransactions() {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      return [];
    }
  },

  /**
   * Adiciona uma nova transação
   * @param {Object} transaction - Dados da transação
   * @returns {Promise<boolean>} true se adicionado com sucesso
   */
  async addTransaction(transaction) {
    try {
      const transactions = await this.getTransactions();

      // Cria uma cópia da transação para processamento
      const processedTransaction = { ...transaction };

      // Converte o preço unitário para número, tratando vírgulas e pontos.
      if (processedTransaction.unitPrice && typeof processedTransaction.unitPrice === 'string') {
        const priceString = processedTransaction.unitPrice.replace(',', '.');
        processedTransaction.unitPrice = parseFloat(priceString);
      }

      // Faz o mesmo para a quantidade, por segurança.
      if (processedTransaction.quantity && typeof processedTransaction.quantity === 'string') {
        const quantityString = processedTransaction.quantity.replace(',', '.');
        processedTransaction.quantity = parseFloat(quantityString);
      }

      // Gera ID único
      const newTransaction = {
        id: Date.now().toString(),
        ...processedTransaction,
        date: processedTransaction.date || new Date().toISOString(),
      };

      transactions.push(newTransaction);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

      console.log(`✅ Transação adicionada: ${newTransaction.ticker}`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      return false;
    }
  },

  /**
   * Salva um array de transações, substituindo as existentes.
   * @param {Array} transactions - O array de transações a ser salvo.
   * @returns {Promise<boolean>} true se salvo com sucesso.
   */
  async saveTransactions(transactions) {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      console.log(`💾 ${transactions.length} transações salvas.`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      return false;
    }
  },

  /**
   * Deleta uma transação
   * @param {string} transactionId - ID da transação
   * @returns {Promise<boolean>} true se deletado com sucesso
   */
  async deleteTransaction(transactionId) {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== transactionId);

      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
      console.log(`✅ Transação deletada`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return false;
    }
  },

  /**
   * Filtra transações por tipo
   * @param {Array} transactions - Array de transações
   * @param {string} type - Tipo ("Compra" ou "Venda")
   * @returns {Array} Transações filtradas
   */
  filterByType(transactions, type) {
    if (type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
  },

  /**
   * Filtra transações por período
   * @param {Array} transactions - Array de transações
   * @param {string} period - Período ("mes", "trimestre", "ano" ou "todos")
   * @returns {Array} Transações filtradas
   */
  filterByPeriod(transactions, period) {
    if (period === 'todos') return transactions;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'mes':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'trimestre':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'ano':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate;
    });
  },

  /**
   * Calcula totais de transações
   * @param {Array} transactions - Array de transações
   * @returns {Object} Objeto com totais
   */
  calculateTotals(transactions) {
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
  },

  /**
   * Calcula o estado do portfólio a partir de uma lista de transações.
   * @param {Array} transactions - Array de todas as transações.
   * @returns {Array} Um array de ativos que representa o portfólio.
   */
  calculatePortfolioFromTransactions(transactions) {
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
  },

  /**
   * Retorna estatísticas por ativo
   * @param {Array} transactions - Array de transações
   * @returns {Object} Objeto com stats por ativo
   */
  getStatsByAsset(transactions) {
    const stats = {};

    transactions.forEach(transaction => {
      if (!stats[transaction.ticker]) {
        stats[transaction.ticker] = {
          ticker: transaction.ticker,
          name: transaction.name,
          totalBought: 0,
          quantityOwned: 0,
          avgPrice: 0,
          totalInvested: 0,
          totalProfit: 0,
        };
      }

      const stat = stats[transaction.ticker];

      if (transaction.type === 'Compra') {
        stat.quantityOwned += transaction.quantity;
        stat.totalInvested += transaction.quantity * transaction.unitPrice;
      } else if (transaction.type === 'Venda') {
        stat.quantityOwned -= transaction.quantity;
        stat.totalProfit += transaction.profit || 0;
      }

      // Calcular preço médio
      if (stat.quantityOwned > 0) {
        stat.avgPrice = stat.totalInvested / stat.quantityOwned;
      }
    });

    return stats;
  },

  /**
   * Busca transações por ticker
   * @param {Array} transactions - Array de transações
   * @param {string} ticker - Ticker do ativo
   * @returns {Array} Transações do ativo
   */
  searchByTicker(transactions, ticker) {
    return transactions.filter(t =>
      t.ticker.toLowerCase().includes(ticker.toLowerCase())
    );
  },

  /**
   * Ordena transações por data (mais recentes primeiro)
   * @param {Array} transactions - Array de transações
   * @returns {Array} Transações ordenadas
   */
  sortByDate(transactions) {
    return [...transactions].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  },

  /**
   * Limpa todas as transações
   * @returns {Promise<boolean>} true se limpo com sucesso
   */
  async clearTransactions() {
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
      console.log('✅ Transações limpas');
      return true;
    } catch (error) {
      console.error('Erro ao limpar transações:', error);
      return false;
    }
  },

  /**
   * Marca que a limpeza inicial de transações foi concluída.
   */
  async markAsCleaned() {
    try {
      await AsyncStorage.setItem(CLEANUP_FLAG_KEY, 'true');
    } catch (error) {
      console.error('Erro ao marcar flag de limpeza:', error);
    }
  },

  /**
   * Verifica se a limpeza inicial já foi executada.
   */
  async hasBeenCleaned() {
    try {
      return (await AsyncStorage.getItem(CLEANUP_FLAG_KEY)) === 'true';
    } catch (error) {
      return false;
    }
  },
};
