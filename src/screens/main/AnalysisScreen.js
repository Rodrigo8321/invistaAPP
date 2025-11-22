import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { colors } from '../../styles/colors';
import { mockPortfolio } from '../../data/mockAssets';
import { exchangeRateService } from '../../services/exchangeRateService';

import PortfolioSummary from '../../components/analysis/PortfolioSummary';
import DiversificationChart from '../../components/analysis/DiversificationChart';
import PerformanceComparison from '../../components/analysis/PerformanceComparison';
import RecommendationsCard from '../../components/analysis/RecommendationsCard';
import SectorDistribution from '../../components/analysis/SectorDistribution';

const AnalysisScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [exchangeRate, setExchangeRate] = useState(5.0);

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    const rate = await exchangeRateService.getUSDtoBRL();
    setExchangeRate(rate);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExchangeRate();
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

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
          <Text style={styles.title}>🔍 Análise</Text>
          <Text style={styles.subtitle}>Análise completa do seu portfolio internacional</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🌍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Portfolio Global</Text>
            <Text style={styles.infoText}>
              Análise completa de {portfolio.length} ativos distribuídos entre Brasil, EUA e criptomoedas.
              Valores em USD convertidos automaticamente para BRL (Taxa: R$ {exchangeRate.toFixed(2)}/USD).
            </Text>
          </View>
        </View>

        {/* Resumo Geral */}
        <PortfolioSummary portfolio={portfolio} />

        {/* Diversificação por Tipo */}
        <View style={styles.sectionContainer}>
          <DiversificationChart portfolio={portfolio} />
        </View>

        {/* Performance Comparison */}
        <View style={styles.sectionContainer}>
          <PerformanceComparison portfolio={portfolio} />
        </View>

        {/* Distribuição por Setor */}
        <View style={styles.sectionContainer}>
          <SectorDistribution portfolio={portfolio} />
        </View>

        {/* Recomendações */}
        <View style={styles.sectionContainer}>
          <RecommendationsCard portfolio={portfolio} />
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
    backgroundColor: colors.background,
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

export default AnalysisScreen;
