import React from 'react';
import { render } from '@testing-library/react-native';
import AnalysisScreen from '../AnalysisScreen';

jest.mock('../../../contexts/PortfolioContext', () => {
  const React = require('react');
  return {
    PortfolioContext: React.createContext({
      portfolio: [],
      loading: false,
      loadPortfolio: jest.fn(),
    }),
  };
});
jest.mock('../../../services/exchangeRateService');
jest.mock('../../../components/analysis/DiversificationChart', () => {
  return () => null;
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
    const { getByText } = render(<AnalysisScreen />);
    expect(getByText('📊 Análise do Portfolio')).toBeTruthy();
  });

  it('renders loading state correctly', () => {
    const { getByText } = render(<AnalysisScreen />);
    expect(getByText('📈 Resumo Geral do Portfolio')).toBeTruthy();
  });

  it('renders all analysis sections', () => {
    const { getByText } = render(<AnalysisScreen />);

    expect(getByText('📈 Resumo Geral do Portfolio')).toBeTruthy();
    expect(getByText('🏆 Ranking de Performance')).toBeTruthy();
    expect(getByText('🌐 Distribuição por Setor')).toBeTruthy();
    expect(getByText('💡 Recomendações')).toBeTruthy();
  });
});
