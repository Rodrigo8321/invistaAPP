import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PortfolioScreen from '../PortfolioScreen';
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

// Mock navigation prop
const navigation = { navigate: jest.fn() };

describe('PortfolioScreen', () => {
  it('renders loading state initially', () => {
    const { getByText } = render(
      <PortfolioProvider>
        <PortfolioScreen navigation={navigation} />
      </PortfolioProvider>
    );
    expect(getByText('Carregando Portfólio...')).toBeTruthy();
  });

  it('displays assets after loading', async () => {
    const { getByText, queryByText } = render(
      <PortfolioProvider>
        <PortfolioScreen navigation={navigation} />
      </PortfolioProvider>
    );
    await waitFor(() => {
      expect(queryByText('Carregando Portfólio...')).toBeNull();
    });
    expect(getByText(/ativos/)).toBeTruthy();
  });

  it('opens AddAssetModal when "+ Adicionar" button is pressed', async () => {
    const { getByText, getByTestId } = render(
      <PortfolioProvider>
        <PortfolioScreen navigation={navigation} />
      </PortfolioProvider>
    );
    const addButton = getByText('+ Adicionar');
    fireEvent.press(addButton);
    await waitFor(() => {
      expect(getByTestId('add-asset-modal')).toBeTruthy();
    });
  });

  // More tests can be added to cover searching, filtering, and adding assets
});
