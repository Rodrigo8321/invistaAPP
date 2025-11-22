import React, { createContext, useState, useEffect, useContext } from 'react';
import storageService from '../services/storageService';

export const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar portfolio do storage na inicialização
  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedPortfolio = await storageService.loadPortfolio();
      setPortfolio(savedPortfolio);
    } catch (err) {
      console.error('❌ Erro ao carregar portfolio:', err);
      setError('Erro ao carregar portfolio');
    } finally {
      setLoading(false);
    }
  };

  const savePortfolio = async (newPortfolio) => {
    try {
      setError(null);
      const success = await storageService.savePortfolio(newPortfolio);
      if (success) {
        setPortfolio(newPortfolio);
        return true;
      } else {
        throw new Error('Falha ao salvar portfolio');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar portfolio:', err);
      setError('Erro ao salvar portfolio');
      return false;
    }
  };

  const addAsset = async (assetData) => {
    try {
      setError(null);
      const newAsset = await storageService.addAsset(assetData);
      setPortfolio(prev => [...prev, newAsset]);
      console.log('✅ Ativo adicionado ao contexto:', newAsset.ticker);
      return newAsset;
    } catch (err) {
      console.error('❌ Erro ao adicionar ativo:', err);
      setError('Erro ao adicionar ativo');
      throw err;
    }
  };

  const updateAsset = async (assetId, updates) => {
    try {
      setError(null);
      const updatedAsset = await storageService.updateAsset(assetId, updates);
      setPortfolio(prev =>
        prev.map(asset =>
          asset.id === assetId ? updatedAsset : asset
        )
      );
      console.log('✅ Ativo atualizado no contexto:', updatedAsset.ticker);
      return updatedAsset;
    } catch (err) {
      console.error('❌ Erro ao atualizar ativo:', err);
      setError('Erro ao atualizar ativo');
      throw err;
    }
  };

  const removeAsset = async (assetId) => {
    try {
      setError(null);
      await storageService.removeAsset(assetId);
      setPortfolio(prev => prev.filter(asset => asset.id !== assetId));
      console.log('✅ Ativo removido do contexto');
      return true;
    } catch (err) {
      console.error('❌ Erro ao remover ativo:', err);
      setError('Erro ao remover ativo');
      throw err;
    }
  };

  const getAssetById = (assetId) => {
    return portfolio.find(asset => asset.id === assetId);
  };

  const getAssetsByCountry = (country) => {
    if (country === 'all') return portfolio;
    return portfolio.filter(asset => asset.country === country);
  };

  const getAssetsByType = (type) => {
    if (type === 'all') return portfolio;
    return portfolio.filter(asset => asset.type === type);
  };

  const getPortfolioStats = () => {
    const totalAssets = portfolio.length;
    const totalInvested = portfolio.reduce((sum, asset) => sum + (asset.avgPrice * asset.quantity), 0);
    const totalCurrent = portfolio.reduce((sum, asset) => sum + (asset.currentPrice * asset.quantity), 0);
    const totalProfit = totalCurrent - totalInvested;
    const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const byCountry = portfolio.reduce((acc, asset) => {
      acc[asset.country] = (acc[asset.country] || 0) + 1;
      return acc;
    }, {});

    const byType = portfolio.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAssets,
      totalInvested,
      totalCurrent,
      totalProfit,
      profitPercent,
      byCountry,
      byType,
    };
  };

  const clearPortfolio = async () => {
    try {
      setError(null);
      await storageService.clearAllData();
      setPortfolio([]);
      console.log('🧹 Portfolio limpo');
      return true;
    } catch (err) {
      console.error('❌ Erro ao limpar portfolio:', err);
      setError('Erro ao limpar portfolio');
      return false;
    }
  };

  const value = {
    // Estado
    portfolio,
    loading,
    error,

    // Ações
    loadPortfolio,
    savePortfolio,
    addAsset,
    updateAsset,
    removeAsset,

    // Getters
    getAssetById,
    getAssetsByCountry,
    getAssetsByType,
    getPortfolioStats,

    // Utilitários
    clearPortfolio,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
