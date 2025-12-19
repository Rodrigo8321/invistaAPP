jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

jest.mock('../../../contexts/PortfolioContext', () => {
  const React = require('react');

  const mockContext = {
    portfolio: [],
    loading: false,
    loadPortfolio: jest.fn(),
  };

  return {
    PortfolioContext: React.createContext(mockContext),
    usePortfolio: () => mockContext,
  };
});

jest.mock('../../../services/marketService', () => ({
  __esModule: true,
  default: {
    getAssetQuote: jest.fn().mockResolvedValue({
      price: 35,
      change: 5,
      changePercent: 16.6,
    }),
    getExchangeRateUSDToBRL: jest.fn().mockResolvedValue(5.41),
  },
}));

jest.mock('../../../config/apiConfig', () => ({
  logAPICall: jest.fn(),
}));

// Mock do módulo de cores
jest.mock('../../../styles/colors', () => {
  return {
    colors: {
      primary: '#000',
      text: '#000',
      textSecondary: '#000',
      surface: '#fff',
    },
  };
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PortfolioScreen from '../PortfolioScreen';
import { PortfolioContext } from '../../../contexts/PortfolioContext';

// Mock useEffect to prevent state updates in tests
const mockUseEffect = jest.spyOn(React, 'useEffect');
mockUseEffect.mockImplementation(() => {});
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

// Mock da prop de navegação
const navigation = { navigate: jest.fn() };

describe('PortfolioScreen', () => {
  it('renderiza título do portfólio', () => {
    const { getByText } = render(
      <PortfolioContext.Provider value={{
        portfolio: [],
        loading: false,
        loadPortfolio: jest.fn()
      }}>
        <PortfolioScreen navigation={navigation} />
      </PortfolioContext.Provider>
    );
    expect(getByText('Portfólio')).toBeTruthy();
  });

  it('exibe ativos', () => {
    const { getByText } = render(
      <PortfolioContext.Provider value={{
        portfolio: [],
        loading: false,
        loadPortfolio: jest.fn()
      }}>
        <PortfolioScreen navigation={navigation} />
      </PortfolioContext.Provider>
    );
    expect(getByText(/ativos/)).toBeTruthy();
  });

  // Mais testes podem ser adicionados para cobrir busca, filtros e adição de ativos
});
