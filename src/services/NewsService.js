// Mock News Service
const NewsService = {
  async getAssetNews(symbol) {
    console.log(`📰 Fetching news for ${symbol}...`);
    
    // Simula uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Retorna notícias mockadas
    return [
      {
        source: 'InfoMoney',
        title: `${symbol} sobe 5% com anúncio de novo contrato bilionário`,
        description: 'As ações da empresa dispararam após o anúncio de um novo contrato de fornecimento para o mercado asiático, consolidando sua posição como líder de mercado.',
        url: 'https://www.infomoney.com.br/',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
      },
      {
        source: 'Valor Econômico',
        title: `Analistas recomendam compra de ${symbol} com preço-alvo de R$ 50`,
        description: 'Em relatório divulgado hoje, o banco de investimentos elevou a recomendação para a empresa, citando forte crescimento e margens saudáveis.',
        url: 'https://valor.globo.com/',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Anteontem
      },
    ];
  }
};

export default NewsService;