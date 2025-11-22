class ExchangeRateService {
  constructor() {
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    this.cache = {
      rate: 5.0,
      timestamp: 0,
      ttl: 3600000, // 1 hora
    };
  }

  async getUSDtoBRL() {
    const now = Date.now();

    // Verificar se o cache ainda é válido
    if (now - this.cache.timestamp < this.cache.ttl) {
      console.log('✅ ExchangeRate: USD/BRL =', this.cache.rate, '(cached)');
      return this.cache.rate;
    }

    try {
      // Simular chamada para API (usando mock por enquanto)
      // const response = await fetch(this.baseUrl);
      // const data = await response.json();
      // const rate = data.rates.BRL;

      // Mock rate com variação pequena
      const baseRate = 5.0;
      const variation = (Math.random() - 0.5) * 0.2; // ±0.1
      const rate = parseFloat((baseRate + variation).toFixed(2));

      this.cache.rate = rate;
      this.cache.timestamp = now;

      console.log('✅ ExchangeRate: USD/BRL =', rate);
      return rate;
    } catch (error) {
      console.error('❌ ExchangeRate: Erro ao buscar taxa:', error);
      return this.cache.rate; // Retornar cache em caso de erro
    }
  }

  // Método para forçar atualização
  async refresh() {
    this.cache.timestamp = 0;
    return this.getUSDtoBRL();
  }
}

export const exchangeRateService = new ExchangeRateService();
