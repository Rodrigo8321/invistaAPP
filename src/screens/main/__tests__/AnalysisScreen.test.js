import React from 'react';
import { render } from '@testing-library/react-native';
import AnalysisScreen from '../AnalysisScreen';
import { PortfolioContext } from '../../../contexts/PortfolioContext';

jest.mock('../../../contexts/PortfolioContext', () => {
  const React = require('react');

  const mockContext = {
    loading: false,
    portfolio: [
      {
        ticker: 'PETR4',
        name: 'Petrobras',
        quantity: 10,
        totalInvested: 300,
        currentPrice: 35,
        assetType: 'STOCK',
      },
    ],
    loadPortfolio: jest.fn(),
  };

  return {
    PortfolioContext: React.createContext(mockContext),
    usePortfolio: () => mockContext,
  };
});
jest.mock('../../../services/exchangeRateService');
jest.mock('../../../components/analysis/DiversificationChart', () => {
  return () => null;
});

// Mock do módulo de cores
jest.mock('../../../styles/colors', () => {
  return {
    colors: {
      primary: '#000',
      text: '#000',
      textSecondary: '#000',
      success: '#000',
      danger: '#000',
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children, style }) => <div style={style}>{children}</div>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('AnalysisScreen', () => {
  it('renders header initially', () => {
    const { getByText } = render(
      <PortfolioContext.Provider value={{
        loading: false,
        portfolio: [],
        loadPortfolio: jest.fn()
      }}>
        <AnalysisScreen />
      </PortfolioContext.Provider>
    );
    expect(getByText('📊 Análise do Portfolio')).toBeTruthy();
  });

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <PortfolioContext.Provider value={{
        loading: true,
        portfolio: [],
        loadPortfolio: jest.fn()
      }}>
        <AnalysisScreen />
      </PortfolioContext.Provider>
    );
    expect(getByText('📈 Resumo Geral do Portfolio')).toBeTruthy();
  });

  it('renders all analysis sections', () => {
    const { getByText } = render(
      <PortfolioContext.Provider value={{
        loading: false,
        portfolio: [],
        loadPortfolio: jest.fn()
      }}>
        <AnalysisScreen />
      </PortfolioContext.Provider>
    );

    expect(getByText('📈 Resumo Geral do Portfolio')).toBeTruthy();
    expect(getByText('🏆 Ranking de Performance')).toBeTruthy();
    expect(getByText('🌐 Distribuição por Setor')).toBeTruthy();
    expect(getByText('💡 Recomendações')).toBeTruthy();
  });
});
