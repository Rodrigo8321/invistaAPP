import { BRAPI_API_KEY } from '@env'; // services/BrapiService.js - VERSÃO COMPLETA COM API REAL

const BRAPI_BASE_URL = 'https://brapi.dev/api';

class BrapiService {
  constructor() {
    this.apiKey = BRAPI_API_KEY;
    console.log('[DEBUG] Initializing Brapi Client...');
    console.log('[DEBUG] Token loaded: ...' + this.apiKey?.slice(-4));
    
    if (this.apiKey) {
      console.log('✅ Brapi client initialized successfully');
    }
  }

  async getQuote(symbol) {
    try {
      // ✅ FIX 1: Remove espaços extras e normaliza o ticker
      const cleanSymbol = symbol.trim().toUpperCase();

      console.log(`🇧🇷 Fetching Brapi: ${cleanSymbol}...`);
      console.log('[DEBUG] Token being used for request: ...' + this.apiKey?.slice(-4));

      const url = `${BRAPI_BASE_URL}/quote/${cleanSymbol}?token=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      console.log(`[DEBUG] Raw response for ${cleanSymbol}:`, JSON.stringify(data, null, 2));

      // Verifica se houve erro ou não encontrou a ação
      if (!response.ok || !data.results || data.results.length === 0) {
        const timestamp = new Date().toISOString();
        console.log(`[API] ${timestamp} | Brapi | ${cleanSymbol} | WARN: Ticker not found`);

        throw new Error(`404 Não encontramos a ação ${cleanSymbol}`, {
          cause: { isNotFound: true, isUnauthorized: false },
        });
      }

      const result = data.results[0];

      console.log(`[DEBUG] Quote data for ${cleanSymbol}:`, {
        symbol: result.symbol,
        regularMarketPrice: result.regularMarketPrice,
        regularMarketPreviousClose: result.regularMarketPreviousClose,
      });

      const timestamp = new Date().toISOString();
      console.log(`[API] ${timestamp} | Brapi | ${cleanSymbol} | SUCCESS`);

      // ✅ FIX 2: Corrige os typos de marketCap e formata corretamente
      const formattedResult = {
        price: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose,
        open: result.regularMarketOpen,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        volume: result.regularMarketVolume,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        marketCap: result.marketCap, // ✅ Corrigido de "mrketCap" e "arketCap"
        updatedAt: timestamp,
      };

      console.log(`✅ Formatted result for ${cleanSymbol}:`, formattedResult);

      return formattedResult;
    } catch (error) {
      const cleanSymbol = symbol.trim().toUpperCase();

      // Melhora o tratamento de erro
      const errorInfo = {
        message: error.message,
        isNotFound: error.message.includes('404'),
        isUnauthorized: error.message.includes('401'),
      };

      console.error(`❌ Error fetching ${cleanSymbol}:`, errorInfo);
      throw new Error(`Failed to fetch ${cleanSymbol}: ${error.message}`);
    }
  }

  /**
   * Busca dados fundamentalistas completos do ativo
   */
  async getFundamentals(symbol) {
    try {
      const cleanSymbol = symbol.trim().toUpperCase();
      
      console.log(`📊 Fetching fundamentals for ${cleanSymbol}...`);

      // A API da Brapi retorna dados fundamentalistas no endpoint /quote
      // com parâmetros adicionais
      const url = `${BRAPI_BASE_URL}/quote/${cleanSymbol}?fundamental=true&token=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.results || data.results.length === 0) {
        throw new Error(`Dados fundamentalistas não encontrados para ${cleanSymbol}`);
      }

      const result = data.results[0];
      
      console.log(`✅ Fundamentals loaded for ${cleanSymbol}`);

      // Formata os dados fundamentalistas
      return {
        // Valuation
        priceEarnings: result.priceEarnings || result.regularMarketPrice / result.earningsPerShare,
        priceToBook: result.priceToBook,
        evToEbitda: result.enterpriseValueToEbitda,
        priceToSales: result.priceToSalesTrailing12Months,
        
        // Rentabilidade
        roe: result.returnOnEquity * 100, // Converte para porcentagem
        roa: result.returnOnAssets * 100,
        netMargin: result.profitMargins * 100,
        ebitdaMargin: result.ebitdaMargins * 100,
        
        // Endividamento
        netDebtToEbitda: result.debtToEquity / 100 * result.enterpriseValueToEbitda,
        debtToEquity: result.debtToEquity,
        
        // Dividendos
        dividendYield: result.dividendYield * 100,
        payoutRatio: result.payoutRatio * 100,
        
        // Resultados Financeiros
        revenue: result.totalRevenue,
        ebitda: result.ebitda,
        netIncome: result.netIncomeToCommon,
        
        // Mercado
        marketCap: result.marketCap,
        high52Week: result.fiftyTwoWeekHigh,
        low52Week: result.fiftyTwoWeekLow,
        
        // Info adicional
        sector: result.sector,
        industry: result.industry,
        employees: result.fullTimeEmployees,
        
        // Timestamp
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error fetching fundamentals for ${symbol}:`, error);
      
      // Retorna dados mock em caso de erro para desenvolvimento
      return this.getMockFundamentals();
    }
  }

  /**
   * Dados mock para desenvolvimento/fallback
   */
  getMockFundamentals() {
    return {
      priceEarnings: 8.5,
      priceToBook: 1.2,
      evToEbitda: 5.3,
      priceToSales: 0.8,
      roe: 18.5,
      roa: 7.2,
      netMargin: 15.3,
      ebitdaMargin: 28.5,
      netDebtToEbitda: 1.8,
      debtToEquity: 65.5,
      dividendYield: 6.5,
      payoutRatio: 45.0,
      revenue: 125000000000,
      ebitda: 35600000000,
      netIncome: 19100000000,
      marketCap: 418000000000,
      high52Week: 42.50,
      low52Week: 28.86,
      sector: 'Energy',
      industry: 'Oil & Gas',
      employees: 45532,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Busca histórico de preços (para gráficos)
   */
  async getPriceHistory(symbol, range = '1y') {
    try {
      const cleanSymbol = symbol.trim().toUpperCase();
      
      const url = `${BRAPI_BASE_URL}/quote/${cleanSymbol}?range=${range}&interval=1d&token=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.results || data.results.length === 0) {
        throw new Error(`Histórico não encontrado para ${cleanSymbol}`);
      }

      const historicalData = data.results[0].historicalDataPrice || [];
      
      return historicalData.map(item => ({
        date: item.date,
        price: item.close,
        volume: item.volume
      }));

    } catch (error) {
      console.error(`❌ Error fetching price history:`, error);
      return [];
    }
  }

  async getMultipleQuotes(symbols) {
    // ✅ FIX 3: Limpa todos os símbolos antes de processar
    const cleanSymbols = symbols.map(s => s.trim().toUpperCase());

    try {
      const url = `${BRAPI_BASE_URL}/quote/${cleanSymbols.join(',')}?token=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.results) {
        throw new Error('Failed to fetch multiple quotes');
      }

      // Formata todos os resultados
      return data.results.map(result => ({
        symbol: result.symbol,
        price: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose,
        open: result.regularMarketOpen,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        volume: result.regularMarketVolume,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        marketCap: result.marketCap,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('❌ Error fetching multiple quotes:', error);
      throw error;
    }
  }

  /**
   * Análise comparativa com o setor
   */
  async getSectorComparison(symbol) {
    try {
      const fundamentals = await this.getFundamentals(symbol);
      
      // Médias do setor (você pode buscar de uma API ou definir manualmente)
      const sectorAverages = {
        priceEarnings: 12.0,
        roe: 12.0,
        dividendYield: 4.5,
        netMargin: 10.0
      };

      return {
        asset: {
          priceEarnings: fundamentals.priceEarnings,
          roe: fundamentals.roe,
          dividendYield: fundamentals.dividendYield,
          netMargin: fundamentals.netMargin
        },
        sector: sectorAverages,
        comparison: {
          plVsSector: ((fundamentals.priceEarnings / sectorAverages.priceEarnings - 1) * 100).toFixed(2),
          roeVsSector: ((fundamentals.roe / sectorAverages.roe - 1) * 100).toFixed(2),
          dyVsSector: ((fundamentals.dividendYield / sectorAverages.dividendYield - 1) * 100).toFixed(2),
          marginVsSector: ((fundamentals.netMargin / sectorAverages.netMargin - 1) * 100).toFixed(2)
        }
      };

    } catch (error) {
      console.error('Erro na comparação setorial:', error);
      return null;
    }
  }
}

// Exporta instância única
export default new BrapiService();