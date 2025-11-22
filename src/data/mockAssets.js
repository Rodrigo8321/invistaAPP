import { mockStocksUS } from './mockStocksUS';
import { mockCrypto } from './mockCrypto';

// Ativos Brasileiros (já existentes)
const mockAssetsBR = [
  {
    id: 1,
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: 'Ação',
    country: 'BR',
    currency: 'BRL',
    quantity: 100,
    avgPrice: 38.50,
    currentPrice: 42.30,
    sector: 'Petróleo',
    fundamentals: {
      pl: 4.2,
      pvp: 0.9,
      roe: 25.3,
      dy: 12.5,
      margLiq: 18.5,
      lpa: 10.07,
      vpa: 47.00,
    }
  },
  {
    id: 2,
    ticker: 'VALE3',
    name: 'Vale ON',
    type: 'Ação',
    country: 'BR',
    currency: 'BRL',
    quantity: 80,
    avgPrice: 65.20,
    currentPrice: 68.90,
    sector: 'Mineração',
    fundamentals: {
      pl: 5.1,
      pvp: 1.2,
      roe: 22.1,
      dy: 10.2,
      margLiq: 28.3,
      lpa: 13.51,
      vpa: 57.42,
    }
  },
  {
    id: 3,
    ticker: 'ITSA4',
    name: 'Itaúsa PN',
    type: 'Ação',
    country: 'BR',
    currency: 'BRL',
    quantity: 200,
    avgPrice: 9.80,
    currentPrice: 10.45,
    sector: 'Financeiro',
    fundamentals: {
      pl: 6.8,
      pvp: 1.4,
      roe: 18.5,
      dy: 6.8,
      margLiq: 35.2,
      lpa: 1.54,
      vpa: 7.46,
    }
  },
  {
    id: 4,
    ticker: 'MXRF11',
    name: 'Maxi Renda',
    type: 'FII',
    country: 'BR',
    currency: 'BRL',
    quantity: 150,
    avgPrice: 10.20,
    currentPrice: 10.65,
    sector: 'Tijolo',
    fundamentals: {
      pvp: 0.98,
      dy: 11.8,
      vpa: 10.87,
      vacancia: 3.2,
    }
  },
  {
    id: 5,
    ticker: 'HGLG11',
    name: 'CSHG Logística',
    type: 'FII',
    country: 'BR',
    currency: 'BRL',
    quantity: 100,
    avgPrice: 165.00,
    currentPrice: 172.50,
    sector: 'Logística',
    fundamentals: {
      pvp: 1.02,
      dy: 9.5,
      vpa: 169.12,
      vacancia: 1.8,
    }
  },
];

// Consolidar todos os ativos
export const mockPortfolio = [
  ...mockAssetsBR,
  ...mockStocksUS,
  ...mockCrypto,
];

// Exportar também separadamente para uso específico
export { mockAssetsBR, mockStocksUS, mockCrypto };

// Função helper para filtrar por país
export const getAssetsByCountry = (country) => {
  if (country === 'all') return mockPortfolio;
  return mockPortfolio.filter(asset => asset.country === country);
};

// Função helper para filtrar por tipo
export const getAssetsByType = (type) => {
  if (type === 'all') return mockPortfolio;
  return mockPortfolio.filter(asset => asset.type === type);
};

// Função helper para filtrar por país E tipo
export const getAssetsByCountryAndType = (country, type) => {
  let filtered = mockPortfolio;

  if (country !== 'all') {
    filtered = filtered.filter(asset => asset.country === country);
  }

  if (type !== 'all') {
    filtered = filtered.filter(asset => asset.type === type);
  }

  return filtered;
};

// Estatísticas do portfolio
export const getPortfolioStats = () => {
  const totalAssets = mockPortfolio.length;
  const byCountry = mockPortfolio.reduce((acc, asset) => {
    acc[asset.country] = (acc[asset.country] || 0) + 1;
    return acc;
  }, {});
  const byType = mockPortfolio.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: totalAssets,
    byCountry,
    byType,
  };
};
