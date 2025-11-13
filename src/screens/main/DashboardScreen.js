import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { marketService } from '../../services/marketService';
import { mockPortfolio } from '../../data/mockAssets';
import StatCard from '../../components/common/StatCard';
import AssetCard from '../../components/common/AssetCard';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar preços reais ao montar
  useEffect(() => {
    loadRealPrices();
  }, []);

  const loadRealPrices = async () => {
    setLoading(true);
    try {
      console.log('📊 Carregando preços reais...');

      const tickers = mockPortfolio.map(a => a.ticker);
      console.log('Tickers:', tickers);

      const quotes = await marketService.getQuotes(tickers);
      console.log('Quotes recebidas:', quotes);

      if (quotes && quotes.length > 0) {
        // Atualizar portfolio com preços reais
        const updated = mockPortfolio.map(asset => {
          const quote = quotes.find(q => q.ticker === asset.ticker);

          if (quote) {
            console.log(`✅ Atualizado ${asset.ticker}: ${quote.currentPrice}`);
            return {
              ...asset,
              currentPrice: quote.currentPrice,
              change: quote.change || 0,
              changePercent: quote.changePercent || 0,
            };
          }

          return asset;
        });

        setPortfolio(updated);
        console.log('✅ Portfolio atualizado com preços reais');
      } else {
        console.log('⚠️ Nenhuma cotação recebida, usando mock');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preços:', error);
      // Continua com mock data
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalInvested = portfolio.reduce(
      (sum, asset) => sum + (asset.quantity * asset.avgPrice), 0
    );
    const totalCurrent = portfolio.reduce(
      (sum, asset) => sum + (asset.quantity * asset.currentPrice), 0
    );
    const totalProfit = totalCurrent - totalInvested;
    const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const byType = portfolio.reduce((acc, asset) => {
      const value = asset.quantity * asset.currentPrice;
      acc[asset.type] = (acc[asset.type] || 0) + value;
      return acc;
    }, {});

    return { totalInvested, totalCurrent, totalProfit, profitPercent, byType };
  }, [portfolio]);

  // Top performers
  const topPerformers = useMemo(() => {
    return [...portfolio]
      .map(asset => ({
        ...asset,
        performance: ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100,
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 3);
  }, [portfolio]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRealPrices();
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
          <View>
            <Text style={styles.greeting}>Olá, Investidor! 👋</Text>
            <Text style={styles.subtitle}>Seu portfólio hoje</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <StatCard
            icon="💰"
            label="Total Investido"
            value={formatCurrency(stats.totalInvested)}
            backgroundColor={colors.primary}
          />
          <StatCard
            icon="📊"
            label="Valor Atual"
            value={formatCurrency(stats.totalCurrent)}
            backgroundColor={colors.secondary}
          />
          <StatCard
            icon={stats.totalProfit >= 0 ? '📈' : '📉'}
            label="Lucro/Prejuízo"
            value={formatCurrency(Math.abs(stats.totalProfit))}
            subValue={`${stats.profitPercent >= 0 ? '+' : ''}${stats.profitPercent.toFixed(2)}%`}
            backgroundColor={stats.totalProfit >= 0 ? colors.success : colors.danger}
          />
        </ScrollView>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumo do Portfólio</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de Ativos</Text>
              <Text style={styles.summaryValue}>{portfolio.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ações</Text>
              <Text style={styles.summaryValue}>
                {portfolio.filter(a => a.type === 'Ação').length}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>FIIs</Text>
              <Text style={styles.summaryValue}>
                {portfolio.filter(a => a.type === 'FII').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Melhores Performances</Text>
          </View>
          {topPerformers.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onPress={() => {
                Alert.alert(
                  asset.ticker,
                  `${asset.name}\nPreço: ${formatCurrency(asset.currentPrice)}\nQuantidade: ${asset.quantity}`
                );
              }}
            />
          ))}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Portfolio')}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>💼</Text>
              </View>
              <Text style={styles.quickActionText}>Ver Portfólio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Analysis')}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>🔍</Text>
              </View>
              <Text style={styles.quickActionText}>Análise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => Alert.alert('Em breve', 'Adicionar ativo')}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>➕</Text>
              </View>
              <Text style={styles.quickActionText}>Adicionar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => Alert.alert('Em breve', 'Relatório')}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>📄</Text>
              </View>
              <Text style={styles.quickActionText}>Relatório</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicadores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Indicadores de Mercado</Text>
          <View style={styles.marketCards}>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>IBOVESPA</Text>
              <Text style={styles.marketValue}>127.458</Text>
              <Text style={[styles.marketChange, { color: colors.success }]}>
                +1.24%
              </Text>
            </View>

            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>DÓLAR</Text>
              <Text style={styles.marketValue}>R$ 4.98</Text>
              <Text style={[styles.marketChange, { color: colors.danger }]}>
                -0.52%
              </Text>
            </View>
          </View>
        </View>

        {/* Distribuição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Distribuição por Tipo</Text>
          <View style={styles.distributionContainer}>
            {Object.entries(stats.byType).map(([type, value]) => {
              const totalCurrent = Object.values(stats.byType).reduce((a, b) => a + b, 0);
              const percent = totalCurrent > 0 ? (value / totalCurrent) * 100 : 0;
              return (
                <View key={type} style={styles.distributionItem}>
                  <View style={styles.distributionHeader}>
                    <Text style={styles.distributionLabel}>{type}</Text>
                    <Text style={styles.distributionPercent}>{percent.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.distributionBar}>
                    <View style={[styles.distributionBarFill, {
                      width: `${percent}%`,
                      backgroundColor: type === 'Ação' ? colors.primary : colors.secondary
                    }]} />
                  </View>
                  <Text style={styles.distributionValue}>
                    {formatCurrency(value)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

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
    paddingTop: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  statsContainer: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  statsContent: {
    paddingRight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: '1%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  marketCards: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  marketCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  marketValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  marketChange: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  distributionContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distributionItem: {
    marginBottom: 20,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  distributionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  distributionPercent: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  distributionBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  distributionBarFill: {
    height: '100%',
  },
  distributionValue: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default DashboardScreen;
