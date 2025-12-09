import { useState, useEffect, useCallback } from 'react';
import { fetchQuote } from '../services/marketService';

/**
 * Custom hook para buscar o preço em tempo real de um ativo.
 * @param {object} initialAsset - O objeto do ativo inicial.
 * @returns {{
 *   realAsset: object,
 *   priceLoading: boolean,
 *   priceError: string | null,
 *   refreshPrice: () => Promise<void>
 * }}
 */
export const useAssetPrice = (initialAsset) => {
  const [realAsset, setRealAsset] = useState(initialAsset);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);

  const loadRealPrice = useCallback(async () => {
    if (!initialAsset?.ticker) return;

    setPriceLoading(true);
    setPriceError(null);
    try {
      const quote = await fetchQuote(initialAsset);
      if (quote) {
        setRealAsset(prev => ({
          ...prev,
          currentPrice: quote.price,
          change: quote.change || 0,
          changePercent: quote.changePercent || 0,
        }));
      }
    } catch (error) {
      const errorMessage = `Não foi possível carregar o preço.`;
      setPriceError(errorMessage);
      console.error(`❌ Erro ao carregar preço para ${initialAsset.ticker}. Erro:`, error.message);
    } finally {
      setPriceLoading(false);
    }
  }, [initialAsset]);

  useEffect(() => {
    loadRealPrice();
  }, [loadRealPrice]);

  return { realAsset, priceLoading, priceError, refreshPrice: loadRealPrice };
};