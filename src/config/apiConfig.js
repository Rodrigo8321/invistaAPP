export const API_CONFIG = {
  // ========== ALPHA VANTAGE (Stocks US) ==========
  alphaVantage: {
    apiKey: 'XMZOTCLPFMINQCOH',
    baseUrl: 'https://www.alphavantage.co/query',
    timeout: 10000, // 10 segundos
    rateLimit: {
      maxRequests: 25,
      perDay: true,
    },
  },

  // ========== COINGECKO (Crypto) ==========
  coinGecko: {
    apiKey: 'CG-w96eV67ifKpSaC3PEW7rsG58',
    baseUrl: 'https://api.coingecko.com/api/v3',
    timeout: 8000, // 8 segundos
    rateLimit: {
      maxRequests: 50,
      perMinute: true,
    },
  },

  // ========== BRAPI (Ativos BR) ==========
  brapi: {
    apiKey: 'hqXr2P4LbitgvSVTnP4AK7', // Token opcional
    baseUrl: 'https://brapi.dev/api',
    timeout: 10000, // 10 segundos
    rateLimit: {
      maxRequests: 100,
      perMinute: true,
    },
  },

  // ========== EXCHANGERATE (Conversão USD/BRL) ==========
  exchangeRate: {
    baseUrl: 'https://economia.awesomeapi.com.br',
    timeout: 5000, // 5 segundos
    // API pública, sem chave necessária
  },

  // ========== CONFIGURAÇÕES GLOBAIS ==========
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutos
    enabled: true,
  },

  retry: {
    maxAttempts: 3,
    delayMs: 2000, // 2 segundos entre tentativas
  },

  fallback: {
    useMockOnError: true, // Volta para mock se API falhar
  },
};

/**
 * Helper: Verifica se as APIs estão configuradas
 */
export const isAPIConfigured = () => {
  return !!(
    API_CONFIG.alphaVantage.apiKey &&
    API_CONFIG.coinGecko.apiKey &&
    API_CONFIG.brapi.apiKey
  );
};

/**
 * Helper: Retorna URL completa com query params
 */
export const buildURL = (baseUrl, endpoint, params = {}) => {
  const url = new URL(endpoint, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

/**
 * Helper: Log de requisições (útil para debug)
 */
export const logAPICall = (service, endpoint, status) => {
  const timestamp = new Date().toISOString();
  console.log(`[API] ${timestamp} | ${service} | ${endpoint} | ${status}`);
};
