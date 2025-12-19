import React, { useContext, useMemo } from 'react';
import { View } from 'react-native';
import StatCard from './StatCard';
import { PortfolioContext } from '../../contexts/PortfolioContext';
import { getPortfolioStats } from '../../domain/portfolio/portfolioStats';

export default function PortfolioSummary() {
  const { portfolio } = useContext(PortfolioContext);

  const stats = useMemo(() => {
    return getPortfolioStats({ portfolio: portfolio || [] });
  }, [portfolio]);

  const profitColor =
    (stats.profit || 0) >= 0 ? '#4CAF50' : '#F44336';

  return (
    <View>
      <StatCard
        title="Valor Atual"
        value={`R$ ${(stats.totalCurrent || 0).toFixed(2)}`}
      />

      <StatCard
        title="Rentabilidade"
        value={`R$ ${(stats.profit || 0).toFixed(2)}`}
        subtitle={`${(stats.profitabilityPercent || 0).toFixed(2)}%`}
        valueColor={profitColor}
      />

      <StatCard
        title="Diversificação"
        value={stats.diversificationCount || 0}
        subtitle="ativos diferentes"
      />

      <StatCard
        title="Dividendos do mês"
        value={`R$ ${(stats.totalMonthlyDividends || 0).toFixed(2)}`}
      />
    </View>
  );
}
