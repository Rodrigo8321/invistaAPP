import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildURL, logAPICall } from '../config/apiConfig';

// ========== CACHE MANAGER ==========
const CACHE_KEYS = {
  QUOTE: 'market_quote_',
  EXCHANGE_RATE: 'exchange_rate_USDBRL',
};

const saveToCache = async (key, data) => {
  try {
    const cacheData = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('❌ Cache save error:', error.message);
  }
};

const getFromCache = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < API_CONFIG.cache.ttl) {
      console.log(`✅ Cache HIT: ${key} (${Math.round(age / 1000)}s old)`);
      return data;
    } else {
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }
  } catch (error) {
    return null;
  }
};

// ========== MAPEAMENTO DE CRYPTO IDs ==========
const CRYPTO_ID_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  ADA: 'cardano',
  SOL: 'solana',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
};

// ========== BRAPI (ATIVOS BRASILEIROS) - CORRIGIDO ==========
const fetchBrapiQuote = async (ticker) => {
  try {
    // CORREÇÃO: Endpoint sem token, API pública
    const url = `https://brapi.dev/api/quote/${ticker}`;

    console.log(`🇧🇷 Fetching Brapi: ${ticker}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // CORREÇÃO: Verifica se resposta é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API returned non-JSON response (HTML)');
    }

    if (!response.ok) {
      throw new Error(`Brapi HTTP ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.results || json.results.length === 0) {
      throw new Error('No data from Brapi');
    }

    const quote = json.results[0];
    
    logAPICall('Brapi', ticker, 'SUCCESS');
    
    return {
      price: quote.regularMarketPrice || quote.regularMarketPreviousClose,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      open: quote.regularMarketOpen,
      previousClose: quote.regularMarketPreviousClose,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logAPICall('Brapi', ticker, `ERROR: ${error.message}`);
    throw error;
  }
};

// ========== ALPHA VANTAGE (STOCKS US) - CORRIGIDO ==========
const fetchAlphaVantageQuote = async (ticker) => {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_CONFIG.alphaVantage.apiKey}`;

    console.log(`🇺🇸 Fetching Alpha Vantage: ${ticker}...`);
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage HTTP ${response.status}`);
    }

    const json = await response.json();
    
    // CORREÇÃO: Melhor verificação de erros
    if (json['Error Message']) {
      throw new Error('Invalid ticker');
    }

    if (json['Note']) {
      throw new Error('API rate limit (25/day)');
    }

    if (json['Information']) {
      throw new Error('API call frequency limit');
    }

    const quote = json['Global Quote'];
    
    // CORREÇÃO: Verifica se quote tem dados
    if (!quote || !quote['05. price']) {
      throw new Error('Empty response from API');
    }

    logAPICall('Alpha Vantage', ticker, 'SUCCESS');
    
    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change'] || 0),
      changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
      volume: parseInt(quote['06. volume'] || 0),
      high: parseFloat(quote['03. high'] || 0),
      low: parseFloat(quote['04. low'] || 0),
      open: parseFloat(quote['02. open'] || 0),
      previousClose: parseFloat(quote['08. previous close'] || 0),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logAPICall('Alpha Vantage', ticker, `ERROR: ${error.message}`);
    throw error;
  }
};

// ========== COINGECKO (CRYPTO) - CORRIGIDO ==========
const fetchCoinGeckoQuote = async (ticker) => {
  try {
    // CORREÇÃO: Usa mapeamento correto de IDs
    const coinId = CRYPTO_ID_MAP[ticker.toUpperCase()] || ticker.toLowerCase();
    
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

    console.log(`💰 Fetching CoinGecko: ${coinId}...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status} - Invalid coin ID: ${coinId}`);
    }

    const json = await response.json();
    
    if (!json.market_data) {
      throw new Error('No market data from CoinGecko');
    }

    const market = json.market_data;
    
    logAPICall('CoinGecko', coinId, 'SUCCESS');
    
    return {
      price: market.current_price.usd,
      change: market.price_change_24h || 0,
      changePercent: market.price_change_percentage_24h || 0,
      volume: market.total_volume.usd || 0,
      marketCap: market.market_cap.usd || 0,
      high: market.high_24h.usd || 0,
      low: market.low_24h.usd || 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logAPICall('CoinGecko', ticker, `ERROR: ${error.message}`);
    throw error;
  }
};

// ========== TAXA DE CÂMBIO - CORRIGIDO ==========
export const fetchExchangeRate = async () => {
  try {
    // CORREÇÃO: Verifica cache primeiro (reduz requisições)
    if (API_CONFIG.cache.enabled) {
      const cached = await getFromCache(CACHE_KEYS.EXCHANGE_RATE);
      if (cached) {
        console.log(`✅ ExchangeRate: USD/BRL = ${cached.toFixed(2)} (cached)`);
        return cached;
      }
    }

    const url = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

    console.log('💱 Fetching exchange rate USD/BRL...');
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Exchange Rate API HTTP ${response.status}`);
    }

    const json = await response.json();
    const rate = parseFloat(json.USDBRL.bid);

    logAPICall('ExchangeRate', 'USD/BRL', 'SUCCESS');
    console.log(`✅ ExchangeRate: USD/BRL = ${rate.toFixed(2)}`);

    // Salva no cache
    await saveToCache(CACHE_KEYS.EXCHANGE_RATE, rate);
    
    return rate;
  } catch (error) {
    logAPICall('ExchangeRate', 'USD/BRL', `ERROR: ${error.message}`);
    // Fallback: tenta buscar do cache expirado
    try {
      const expiredCache = await AsyncStorage.getItem(CACHE_KEYS.EXCHANGE_RATE);
      if (expiredCache) {
        const { data } = JSON.parse(expiredCache);
        console.warn(`⚠️ Using expired cache exchange rate: ${data.toFixed(2)}`);
        return data;
      }
    } catch {}
    
    // Fallback final
    console.warn('⚠️ Using fallback exchange rate: 5.00');
    return 5.00;
  }
};

// ========== ORQUESTRADOR PRINCIPAL ==========
export const fetchQuote = async (asset) => {
  const cacheKey = `${CACHE_KEYS.QUOTE}${asset.ticker}`;

  try {
    // Verifica cache
    if (API_CONFIG.cache.enabled) {
      const cached = await getFromCache(cacheKey);
      if (cached) return cached;
    }

    let quote;

    // Detecta tipo e chama API correta
    if (asset.type === 'Ação' || asset.type === 'FII') {
      quote = await fetchBrapiQuote(asset.ticker);
    } else if (asset.type === 'Stock' || asset.type === 'REIT' || asset.type === 'ETF') {
      quote = await fetchAlphaVantageQuote(asset.ticker);
    } else if (asset.type === 'Crypto') {
      quote = await fetchCoinGeckoQuote(asset.ticker);
    } else {
      throw new Error(`Unknown asset type: ${asset.type}`);
    }

    // Salva no cache
    await saveToCache(cacheKey, quote);

    return quote;
  } catch (error) {
    console.error(`❌ Failed to fetch ${asset.ticker}:`, error.message);

    // Fallback para mock data
    if (API_CONFIG.fallback.useMockOnError) {
      console.warn(`⚠️ Using mock data for ${asset.ticker}`);
      return {
        price: asset.currentPrice,
        change: asset.currentPrice - asset.averagePrice,
        changePercent: ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100,
        volume: 1000000,
        updatedAt: new Date().toISOString(),
        isMock: true,
      };
    }

    throw error;
  }
};



export const clearCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => 
      k.startsWith(CACHE_KEYS.QUOTE) || 
      k === CACHE_KEYS.EXCHANGE_RATE
    );
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`🗑️ Cache cleared: ${cacheKeys.length} items removed`);
  } catch (error) {
    console.error('❌ Cache clear error:', error.message);
  }
};
