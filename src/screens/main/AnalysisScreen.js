import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import { PortfolioContext } from '../../contexts/PortfolioContext';

// Importando componentes de análise
import PortfolioSummary from '../../components/analysis/PortfolioSummary';
import PerformanceComparison from '../../components/analysis/PerformanceComparison';
import DiversificationChart from '../../components/analysis/DiversificationChart';
import SectorDistribution from '../../components/analysis/SectorDistribution';
import RecommendationsCard from '../../components/analysis/RecommendationsCard';

const AnalysisScreen = () => {
  const { portfolio, loading, loadPortfolio } = useContext(PortfolioContext);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Carregar dados do portfolio se necessário
    if (!portfolio && !loading) {
      loadPortfolio();
    }
  }, [portfolio, loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  if (loading && !portfolio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando análise do portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📊 Análise do Portfolio</Text>
          <Text style={styles.subtitle}>
            Insights detalhados sobre seu investimento
          </Text>
        </View>

        {/* Resumo Geral */}
        <PortfolioSummary portfolio={portfolio} />

        {/* Comparação de Performance */}
        <PerformanceComparison portfolio={portfolio} />

        {/* Gráfico de Diversificação */}
        <DiversificationChart portfolio={portfolio} />

        {/* Distribuição por Setor */}
        <SectorDistribution portfolio={portfolio} />

        {/* Recomendações */}
        <RecommendationsCard portfolio={portfolio} />

        {/* Espaço final */}
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
    textAlign: 'center',
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
});

export default AnalysisScreen;
