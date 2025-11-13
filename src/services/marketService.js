import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@InvestPro:marketCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
const API_BASE_URL = 'https://brapi.dev/api/quote';

export const marketService = {
  /**
   * Busca cotação de um ativo
   * @param {string} ticker - Ticker do ativo (ex: "PETR4")
   * @param {boolean} forceRefresh - Forçar atualização da API
   * @returns {Promise<Object>} Dados do ativo com preço atual
   */
  async getQuote(ticker, forceRefresh = false) {
    try {
      console.log(`📊 Buscando cotação: ${ticker}`);

      // Tentar cache primeiro (se não for forceRefresh)
      if (!forceRefresh) {
        const cached = await this.getCachedQuote(ticker);
        if (cached) {
          console.log(`✅ Usando cache para ${ticker}`);
          return cached;
        }
      }

      // Buscar da API
      const quote = await this.fetchFromAPI(ticker);
      
      if (quote) {
        // Salvar em cache
        await this.saveCachedQuote(ticker, quote);
        console.log(`✅ Atualizado da API: ${ticker}`);
        return quote;
      }

      throw new Error('Dados não disponíveis na API');
    } catch (error) {
      console.error(`❌ Erro ao buscar ${ticker}:`, error.message);
      
      // Tentar cache como fallback
      const cached = await this.getCachedQuote(ticker, true); // Ignorar expiração
      if (cached) {
        console.log(`⚠️ Usando cache expirado para ${ticker}`);
        return cached;
      }

      // Retornar null se nada funcionar
      return null;
    }
  },

  /**
   * Busca múltiplas cotações de uma vez
   * @param {Array<string>} tickers - Array de tickers
   * @returns {Promise<Array>} Array com dados de todos os ativos
   */
  async getQuotes(tickers) {
    try {
      console.log(`📊 Buscando ${tickers.length} cotações...`);

      const quotes = await Promise.all(
        tickers.map(ticker => this.getQuote(ticker))
      );

      return quotes.filter(q => q !== null);
    } catch (error) {
      console.error('❌ Erro ao buscar múltiplas cotações:', error.message);
      return [];
    }
  },

  /**
   * Busca dados da API Brapi
   * @param {string} ticker - Ticker do ativo
   * @returns {Promise<Object>} Dados processados do ativo
   */
  async fetchFromAPI(ticker) {
    try {
      // Implementar timeout manual com AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(
        `${API_BASE_URL}/${ticker}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validar resposta
      if (!data.results || data.results.length === 0) {
        throw new Error('Nenhum resultado da API');
      }

      const result = data.results[0];

      // Processar e retornar dados
      return {
        ticker: result.symbol || ticker,
        name: result.name || ticker,
        currentPrice: result.close || result.lastPrice || 0,
        change: result.change || 0,
        changePercent: result.changePercent || 0,
        high: result.high || 0,
        low: result.low || 0,
        open: result.open || 0,
        volume: result.volume || 0,
        timestamp: new Date().toISOString(),
        source: 'brapi',
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏰ Timeout ao buscar ${ticker}`);
        throw new Error('Timeout na requisição');
      }
      console.error(`❌ Erro ao buscar de API (${ticker}):`, error.message);
      throw error;
    }
  },

  /**
   * Obtém cotação do cache
   * @param {string} ticker - Ticker do ativo
   * @param {boolean} ignoreExpiration - Ignorar expiração do cache
   * @returns {Promise<Object|null>} Dados do cache ou null
   */
  async getCachedQuote(ticker, ignoreExpiration = false) {
    try {
      const cache = await AsyncStorage.getItem(CACHE_KEY);
      if (!cache) return null;

      const cacheData = JSON.parse(cache);
      const quote = cacheData[ticker];

      if (!quote) return null;

      // Verificar expiração
      if (!ignoreExpiration) {
        const age = Date.now() - new Date(quote.timestamp).getTime();
        if (age > CACHE_DURATION) {
          console.log(`⏰ Cache expirado para ${ticker}`);
          return null;
        }
      }

      return quote;
    } catch (error) {
      console.error('Erro ao ler cache:', error);
      return null;
    }
  },

  /**
   * Salva cotação no cache
   * @param {string} ticker - Ticker do ativo
   * @param {Object} quote - Dados da cotação
   * @returns {Promise<boolean>} true se salvo com sucesso
   */
  async saveCachedQuote(ticker, quote) {
    try {
      const cache = await AsyncStorage.getItem(CACHE_KEY);
      const cacheData = cache ? JSON.parse(cache) : {};

      cacheData[ticker] = {
        ...quote,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
      return false;
    }
  },

  /**
   * Limpa todo o cache
   * @returns {Promise<boolean>} true se limpo com sucesso
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log('✅ Cache limpo');
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  },

  /**
   * Atualiza múltiplas cotações (para sincronização periódica)
   * @param {Array<string>} tickers - Array de tickers
   * @returns {Promise<Array>} Dados atualizados
   */
  async refreshQuotes(tickers) {
    try {
      console.log(`🔄 Atualizando ${tickers.length} cotações...`);

      const quotes = await Promise.all(
        tickers.map(ticker => this.getQuote(ticker, true)) // forceRefresh = true
      );

      console.log(`✅ ${quotes.filter(q => q).length}/${tickers.length} cotações atualizadas`);
      return quotes.filter(q => q !== null);
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
      return [];
    }
  },

  /**
   * Calcula estatísticas do mercado
   * @param {Array} quotes - Array de cotações
   * @returns {Object} Estatísticas
   */
  calculateStats(quotes) {
    if (!quotes || quotes.length === 0) {
      return {
        totalChange: 0,
        positivesCount: 0,
        negativesCount: 0,
        avgChange: 0,
      };
    }

    const positives = quotes.filter(q => q.changePercent >= 0).length;
    const negatives = quotes.filter(q => q.changePercent < 0).length;
    const avgChange = quotes.reduce((sum, q) => sum + q.changePercent, 0) / quotes.length;

    return {
      totalChange: quotes.reduce((sum, q) => sum + q.changePercent, 0),
      positivesCount: positives,
      negativesCount: negatives,
      avgChange: avgChange.toFixed(2),
    };
  },

  /**
   * Monitora um ativo (atualiza a cada X segundos)
   * @param {string} ticker - Ticker do ativo
   * @param {number} interval - Intervalo em segundos (padrão: 60)
   * @param {function} callback - Função chamada ao atualizar
   * @returns {function} Função para parar o monitoramento
   */
  monitorQuote(ticker, interval = 60, callback) {
    console.log(`👁️ Monitorando ${ticker} a cada ${interval}s`);

    const intervalId = setInterval(async () => {
      const quote = await this.getQuote(ticker, true); // forceRefresh
      if (quote && callback) {
        callback(quote);
      }
    }, interval * 1000);

    // Retornar função para parar
    return () => {
      clearInterval(intervalId);
      console.log(`🛑 Parou monitoramento de ${ticker}`);
    };
  },

  /**
   * Verifica conectividade com API
   * @returns {Promise<boolean>} true se API está acessível
   */
  async checkConnectivity() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/PETR4`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('❌ Sem conexão com API');
      return false;
    }
  },
};
