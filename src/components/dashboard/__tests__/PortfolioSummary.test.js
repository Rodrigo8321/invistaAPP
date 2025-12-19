jest.mock('../../../contexts/PortfolioContext', () => {
  const React = require('react');

  return {
    PortfolioContext: React.createContext({
      portfolio: [],
    }),
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import PortfolioSummary from '../PortfolioSummary';
import { PortfolioContext } from '../../../contexts/PortfolioContext';

// 🔹 Mock da função de domínio
jest.mock('../../../domain/portfolio/portfolioStats', () => ({
  getPortfolioStats: jest.fn(() => ({
    totalCurrentValue: 10000,
    totalProfit: 1500,
    profitPercent: 15,
    diversification: 5,
    monthlyDividends: 200,
  })),
}));

describe('PortfolioSummary', () => {
  it('renderiza os cards com dados do portfólio', () => {
    const mockPortfolio = [
      { ticker: 'PETR4', quantity: 10 },
      { ticker: 'VALE3', quantity: 5 },
    ];

    const { getByText } = render(
      <PortfolioContext.Provider value={{ portfolio: mockPortfolio }}>
        <PortfolioSummary />
      </PortfolioContext.Provider>
    );

    // 📌 Títulos
    expect(getByText('Valor Atual')).toBeTruthy();
    expect(getByText('Rentabilidade')).toBeTruthy();
    expect(getByText('Diversificação')).toBeTruthy();
    expect(getByText('Dividendos do mês')).toBeTruthy();

    // 📌 Valores
    expect(getByText('R$ 10000.00')).toBeTruthy();
    expect(getByText('R$ 1500.00')).toBeTruthy();
    expect(getByText('15.00%')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('R$ 200.00')).toBeTruthy();
  });
});
