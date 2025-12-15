// src/contexts/__mocks__/PortfolioContext.js

import React from 'react';

export const PortfolioContext = React.createContext({
  portfolio: [],
  loading: true,
  error: null,
});

export const PortfolioProvider = ({ children }) => {
  return (
    <PortfolioContext.Provider value={{ portfolio: [], loading: true, error: null }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => ({
  portfolio: [],
  loading: true,
  error: null,
});
