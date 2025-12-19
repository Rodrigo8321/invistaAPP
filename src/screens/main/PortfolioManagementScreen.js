import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import colors from '../../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePortfolio } from '../../contexts/PortfolioContext'; // 1. Importar o hook do contexto
import { fetchQuote, fetchExchangeRate } from '../../services/marketService'; // Importar serviços de API

import PortfolioSummary from '../../components/analysis/PortfolioSummary';
import DiversificationChart from '../../components/analysis/DiversificationChart';
import PerformanceComparison from '../../components/analysis/PerformanceComparison';
import RecommendationsCard from '../../components/analysis/RecommendationsCard';
import SectorDistribution from '../../components/analysis/SectorDistribution';
import { ActivityIndicator } from 'react-native';

const PortfolioManagementScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  // 2. Usar o portfólio e o estado de loading do contexto
  const { portfolio, loading: portfolioLoading, reloadPortfolio } = usePortfolio();
  const [realPrices, setRealPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(5.0);
  const [isFetchingPrices, setIsFetchingPrices] = useState(true);

  const loadRealData = async (showLoader = true) => {
    if (portfolio.length === 0) {
      setIsFetchingPrices(false);
      setRefreshing(false);
      return;
    }
    if (showLoader) setIsFetchingPrices(true);

    const rate = await fetchExchangeRate();
    setExchangeRate(rate);

    const pricesPromises = portfolio.map(asset => fetchQuote(asset));
    const results = await Promise.allSettled(pricesPromises);

    const pricesMap = results.reduce((acc, result, index) => {
      if (result.status === 'fulfilled') {
        acc[portfolio[index].ticker] = result.value;
      }
      return acc;
    }, {});

    setRealPrices(pricesMap);
    setIsFetchingPrices(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!portfolioLoading) {
      loadRealData();
    }
  }, [portfolioLoading, portfolio]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadPortfolio();
    await loadRealData(false);
    setRefreshing(false);
  };

  // 4. Exibir um indicador de carregamento enquanto os dados do portfólio são carregados
  if (portfolioLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando Análise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Combina os dados do portfólio com os preços em tempo real
  const portfolioWithRealPrices = portfolio.map(asset => {
    const realPrice = realPrices[asset.ticker];
    const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
    const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
    const current = priceInBRL * asset.quantity;

    return {
      ...asset,
      currentPrice: priceInBRL,
      currentValue: current,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Gestão do Portfólio</Text>
          <Text style={styles.subtitle}>Gestão completa do seu portfolio</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🌍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Portfolio Global</Text>
            <Text style={styles.infoText}>
              Análise completa de {portfolio.length} ativos distribuídos entre Brasil, EUA e criptomoedas.
            </Text>
          </View>
        </View>

        {isFetchingPrices && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />}

        {/* Resumo Geral */}
        <PortfolioSummary portfolio={portfolioWithRealPrices} />

        {/* Diversificação por Tipo */}
        <View style={styles.sectionContainer}>
          <DiversificationChart portfolio={portfolioWithRealPrices} />
        </View>

        {/* Performance Comparison */}
        <View style={styles.sectionContainer}>
          <PerformanceComparison portfolio={portfolioWithRealPrices} />
        </View>

        {/* Distribuição por Setor */}
        <View style={styles.sectionContainer}>
          <SectorDistribution portfolio={portfolioWithRealPrices} />
        </View>

        {/* Recomendações */}
        <View style={styles.sectionContainer}>
          <RecommendationsCard portfolio={portfolioWithRealPrices} />
        </View>

        {/* Estatísticas Internacionais */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Estatísticas Globais</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ativos Brasileiros</Text>
            <Text style={styles.statValue}>
              {portfolio.filter(a => a.country === 'BR').length} ativos
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ativos Americanos</Text>
            <Text style={styles.statValue}>
              {portfolio.filter(a => a.country === 'US').length} ativos
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Criptomoedas</Text>
            <Text style={styles.statValue}>
              {portfolio.filter(a => a.country === 'Global').length} ativos
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total de Tipos</Text>
            <Text style={styles.statValue}>
              {new Set(portfolio.map(a => a.type)).size} tipos
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total de Setores</Text>
            <Text style={styles.statValue}>
              {new Set(portfolio.map(a => a.sector)).size} setores
            </Text>
          </View>
        </View>

        {/* Footer Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  infoText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
});

export default PortfolioManagementScreen;
