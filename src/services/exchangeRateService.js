class ExchangeRateService {
  constructor() {
    this.baseUrl = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';
    this.cache = {
      rate: 5.0,
      timestamp: 0,
      ttl: 3600000, // 1 hora
    };
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 segundo entre requisições
  }

  async getUSDtoBRL() {
    const now = Date.now();

    // Verificar se o cache ainda é válido
    if (now - this.cache.timestamp < this.cache.ttl && this.cache.rate > 0) {
      console.log('✅ ExchangeRate: USD/BRL =', this.cache.rate.toFixed(2), '(cached)');
      return this.cache.rate;
    }

    // Rate limiting: evitar requisições muito frequentes
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      console.log('⏳ ExchangeRate: Aguardando rate limit...');
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }

    try {
      this.lastRequestTime = Date.now();

      console.log('💱 Fetching exchange rate USD/BRL...');

      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InvistaApp/1.0',
        },
        timeout: 5000, // 5 segundos timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.USDBRL || !data.USDBRL.bid) {
        throw new Error('Resposta da API inválida');
      }

      const rate = parseFloat(data.USDBRL.bid);

      if (isNaN(rate) || rate <= 0) {
        throw new Error('Taxa de câmbio inválida recebida da API');
      }

      this.cache.rate = rate;
      this.cache.timestamp = now;

      console.log('✅ ExchangeRate: USD/BRL =', rate.toFixed(2));
      return rate;

    } catch (error) {
      console.error('❌ ExchangeRate: Erro ao buscar taxa:', error.message);

      // Tentar usar cache expirado se disponível
      if (this.cache.rate > 0) {
        console.warn('⚠️ Using expired cache exchange rate:', this.cache.rate.toFixed(2));
        return this.cache.rate;
      }

      // Fallback final
      console.warn('⚠️ Using fallback exchange rate: 5.00');
      return 5.00;
    }
  }

  // Método para forçar atualização
  async refresh() {
    this.cache.timestamp = 0;
    return this.getUSDtoBRL();
  }

  // Método para obter taxa sem cache (para testes)
  async getFreshRate() {
    const oldTimestamp = this.cache.timestamp;
    this.cache.timestamp = 0;
    const rate = await this.getUSDtoBRL();
    this.cache.timestamp = oldTimestamp; // Restaurar timestamp do cache
    return rate;
  }
}

export const exchangeRateService = new ExchangeRateService();
