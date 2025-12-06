import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AnalysisScreen from '../AnalysisScreen';
import { PortfolioProvider } from '../../../contexts/PortfolioContext';

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
  it('renders loading state initially', () => {
    const { getByText } = render(
      <PortfolioProvider>
        <AnalysisScreen />
      </PortfolioProvider>
    );
    expect(getByText('Carregando análise do portfolio...')).toBeTruthy();
  });

  it('renders header after loading', async () => {
    const { getByText, queryByText } = render(
      <PortfolioProvider>
        <AnalysisScreen />
      </PortfolioProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Carregando análise do portfolio...')).toBeNull();
    });

    // Check if header is rendered
    expect(getByText('📊 Análise do Portfolio')).toBeTruthy();
    expect(getByText('Insights detalhados sobre seu investimento')).toBeTruthy();
  });

  it('renders all analysis components', async () => {
    const { getByText, queryByText } = render(
      <PortfolioProvider>
        <AnalysisScreen />
      </PortfolioProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Carregando análise do portfolio...')).toBeNull();
    });

    // Check if analysis components are rendered
    expect(getByText('📈 Resumo Geral do Portfolio')).toBeTruthy();
    expect(getByText('🏆 Ranking de Performance')).toBeTruthy();
    expect(getByText('🎯 Diversificação do Portfolio')).toBeTruthy();
    expect(getByText('🌐 Distribuição por Setor')).toBeTruthy();
    expect(getByText('💡 Recomendações')).toBeTruthy();
  });
});
