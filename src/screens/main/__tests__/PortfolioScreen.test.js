import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PortfolioScreen from '../PortfolioScreen';
import { PortfolioProvider } from '../../../contexts/PortfolioContext';

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
