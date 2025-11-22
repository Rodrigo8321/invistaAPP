import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'DEMO'; // Usar 'DEMO' para testes, depois obter key em alphavantage.co
const BASE_URL = 'https://www.alphavantage.co/query';
const CACHE_KEY = '@InvestPro:alphaVantageCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const alphaVantageService = {
  /**
   * Busca cotação de uma ação americana
   * @param {string} symbol - Símbolo da ação (ex: "AAPL", "TSLA")
   * @returns {Promise<Object|null>} Dados da cotação ou null
   */
  async getQuote(symbol) {
    try {
      // 1. Verificar cache primeiro
      const cached = await this.getFromCache(symbol);
      if (cached) {
        console.log(`✅ AlphaVantage: ${symbol} (cache)`);
        return cached;
      }

      // 2. Buscar da API
      console.log(`🌐 AlphaVantage: Buscando ${symbol}...`);
      
      const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      // 3. Verificar se há dados válidos
      if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
        console.log(`⚠️ AlphaVantage: ${symbol} não encontrado`);
        return null;
      }

      const quote = data['Global Quote'];
      
      // 4. Formatar resposta
      const result = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: new Date().toISOString(),
      };

      // 5. Salvar no cache
      await this.saveToCache(symbol, result);

      console.log(`✅ AlphaVantage: ${symbol} = $${result.price}`);
      return result;

    } catch (error) {
      console.error(`❌ AlphaVantage: Erro ao buscar ${symbol}:`, error.message);
      return null;
    }
  },

  /**
   * Busca múltiplas cotações
   * @param {string[]} symbols - Array de símbolos
   * @returns {Promise<Object>} Objeto com { symbol: quote }
   */
  async getMultipleQuotes(symbols) {
    const results = {};
    
    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol);
      if (quote) {
        results[symbol] = quote;
      }
      // Pequeno delay para não bater rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  },

  /**
   * Busca dados do cache
   */
  async getFromCache(symbol) {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cacheData) return null;

      const cache = JSON.parse(cacheData);
      const item = cache[symbol];

      if (!item) return null;

      const age = Date.now() - new Date(item.timestamp).getTime();
      if (age > CACHE_DURATION) {
        return null; // Cache expirado
      }

      return item;
    } catch (error) {
      return null;
    }
  },

  /**
   * Salva no cache
   */
  async saveToCache(symbol, data) {
    try {
      let cache = {};
      const cacheData = await AsyncStorage.getItem(CACHE_KEY);
      
      if (cacheData) {
        cache = JSON.parse(cacheData);
      }

      cache[symbol] = data;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  },

  /**
   * Limpa o cache
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log('✅ Cache Alpha Vantage limpo');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  },
};
