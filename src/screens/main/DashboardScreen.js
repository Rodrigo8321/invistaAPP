import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { mockPortfolio as mockAssets } from '../../data/mockAssets';
import { fetchMultipleQuotes, fetchExchangeRate, clearCache } from '../../services/marketService';
import TransactionModal from '../../components/transactions/TransactionModal';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [portfolio] = useState(mockAssets);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realPrices, setRealPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(5.0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(['acao']); // array of filters
  const filterMap = { acao: 'Ação', fii: 'FII', stock: 'Stock', reit: 'REIT', etf: 'ETF', crypto: 'Crypto' };
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [weeklyStartPrices, setWeeklyStartPrices] = useState({});
  const [lastManualUpdate, setLastManualUpdate] = useState(null);

  // ========== CARREGAR DADOS REAIS ==========
  const loadRealData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const rate = await fetchExchangeRate();
      setExchangeRate(rate);

      const quotes = await fetchMultipleQuotes(portfolio);

      const pricesMap = {};
      let errors = 0;

      quotes.forEach((quote, index) => {
        const asset = portfolio[index];

        if (quote.error) {
          errors++;
          pricesMap[asset.ticker] = {
            price: asset.currentPrice,
            isMock: true,
          };
        } else {
          pricesMap[asset.ticker] = {
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            isMock: quote.isMock || false,
          };
        }
      });

      setRealPrices(pricesMap);
      setErrorCount(errors);
      setLastUpdate(new Date());

      // Reset weekly start prices every Sunday
      const today = new Date();
      if (today.getDay() === 0) { // 0 is Sunday
        const newWeeklyStartPrices = {};
        Object.keys(pricesMap).forEach(ticker => {
          newWeeklyStartPrices[ticker] = pricesMap[ticker].price;
        });
        setWeeklyStartPrices(newWeeklyStartPrices);
      }
    } catch (error) {
      console.error('❌ Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRealData();
    const interval = setInterval(() => loadRealData(false), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRealData(false);
  };

  const handleManualRefresh = () => {
    const now = new Date();
    if (!lastManualUpdate || (now - lastManualUpdate) >= 60 * 60 * 1000) { // 1 hour in ms
      setLastManualUpdate(now);
      setRefreshing(true);
      loadRealData(false);
    } else {
      Alert.alert('Atenção', 'Você só pode atualizar uma vez por hora.');
    }
  };

  // ========== CÁLCULOS ==========
  const stats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalStocks = 0;
    let totalCrypto = 0;
    let totalInvestedUSD = 0;

    portfolio.forEach(asset => {
      const realPrice = realPrices[asset.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
      const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;

      const invested = asset.averagePrice * asset.quantity;
      const current = priceInBRL * asset.quantity;

      totalInvested += invested;
      totalCurrent += current;

      if (asset.type === 'Crypto') {
        totalCrypto += current;
      } else {
        totalStocks += current;
      }

      // Sum invested in USD for stocks, REITs, ETFs
      if (asset.currency === 'USD' && ['Stock', 'REIT', 'ETF'].includes(asset.type)) {
        totalInvestedUSD += invested;
      }
    });

    const profit = totalCurrent - totalInvested;
    const profitPercent = (profit / totalInvested) * 100;

    return {
      invested: totalInvested,
      current: totalCurrent,
      profit,
      profitPercent,
      stocksPercent: (totalStocks / totalCurrent) * 100,
      cryptoPercent: (totalCrypto / totalCurrent) * 100,
      investedUSD: totalInvestedUSD,
    };
  }, [portfolio, realPrices, exchangeRate]);

  // Alocações por categoria
  const categoryAllocations = useMemo(() => {
    const typeTotals = {};

    portfolio.forEach(asset => {
      const realPrice = realPrices[asset.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
      const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
      const value = priceInBRL * asset.quantity;
      const key = asset.type.toLowerCase().replace('ção', 'cao');

      typeTotals[key] = (typeTotals[key] || 0) + value;
    });

    const total = Object.values(typeTotals).reduce((sum, val) => sum + val, 0);

    return Object.entries(typeTotals)
      .map(([key, value]) => ({
        type: key,
        value,
        percentage: (value / total) * 100,
        label: filterMap[key] || key,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [portfolio, realPrices, exchangeRate]);

  // Assets com dados reais
  const assetsWithRealPrices = useMemo(() => {
    return portfolio.map(asset => {
      const realPrice = realPrices[asset.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
      const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
      const invested = asset.averagePrice * asset.quantity;
      const current = priceInBRL * asset.quantity;
      const profit = current - invested;
      const profitPercent = (profit / invested) * 100;

      // Calculate weekly change
      const weeklyStartPrice = weeklyStartPrices[asset.ticker];
      const weeklyChange = weeklyStartPrice ? ((currentPrice - weeklyStartPrice) / weeklyStartPrice) * 100 : 0;

      return {
        ...asset,
        currentPriceReal: priceInBRL,
        profit,
        profitPercent,
        weeklyChange,
        isMock: realPrice?.isMock || false,
      };
    });
  }, [portfolio, realPrices, exchangeRate, weeklyStartPrices]);

  // Filtros
  const filteredAssets = useMemo(() => {
    let filtered = assetsWithRealPrices;

    if (selectedFilter.length > 0) {
      filtered = filtered.filter(a => selectedFilter.includes(a.type.toLowerCase().replace('ção', 'cao')));
    }

    return filtered.sort((a, b) => b.weeklyChange - a.weeklyChange);
  }, [assetsWithRealPrices, selectedFilter]);

  // Top 3 e Worst 3
  const topPerformers = filteredAssets.slice(0, 3);
  const worstPerformers = [...filteredAssets].reverse().slice(0, 3);

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando Portfolio</Text>
            <Text style={styles.loadingSubtext}>Buscando cotações em tempo real...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========== HANDLERS ==========
  const handleNewTransaction = () => {
    setTransactionModalVisible(true);
  };

  const handleTransactionAdded = () => {
    setTransactionModalVisible(false);
    // Optionally refresh data or show success message
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION - Portfolio Value */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroGreeting}>Olá! Investidor 👋</Text>
              <Text style={styles.heroSubtitle}>Seu patrimônio hoje</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroValueContainer}>
            <Text style={styles.heroValue}>{formatCurrency(stats.current)}</Text>
            <View style={styles.heroProfitContainer}>
              <View style={[
                styles.heroProfitBadge,
                { backgroundColor: stats.profit >= 0 ? colors.success + '20' : colors.danger + '20' }
              ]}>
                <Text style={[
                  styles.heroProfitText,
                  { color: stats.profit >= 0 ? colors.success : colors.danger }
                ]}>
                  {stats.profit >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(stats.profit))} ({formatPercent(Math.abs(stats.profitPercent))})
                </Text>
              </View>
            </View>
          </View>

          {/* INVESTIMENTO EM USD */}
          <View style={styles.usdInvestmentSection}>
            <View style={styles.usdInvestmentCard}>
              <Text style={styles.usdInvestmentTitle}>Investimento em DOLLAR</Text>
              <Text style={styles.usdInvestmentSubtitle}>STOCK´S, REITs e ETFs</Text>
              <View style={styles.usdInvestmentValues}>
                <View style={styles.usdInvestmentValue}>
                  <Text style={styles.usdInvestmentLabel}>USD</Text>
                  <Text style={styles.usdInvestmentAmount}>${stats.investedUSD.toFixed(2)}</Text>
                </View>
                <View style={styles.usdInvestmentDivider} />
                <View style={styles.usdInvestmentValue}>
                  <Text style={styles.usdInvestmentLabel}>BRL</Text>
                  <Text style={styles.usdInvestmentAmount}>{formatCurrency(stats.investedUSD * exchangeRate)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Investido</Text>
              <Text style={styles.quickStatValue}>{formatCurrency(stats.invested)}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Ativos</Text>
              <Text style={styles.quickStatValue}>{portfolio.length}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>USD/BRL</Text>
              <Text style={styles.quickStatValue}>R$ {exchangeRate.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ALOCAÇÃO */}
        <View style={styles.allocationSection}>
          <Text style={styles.sectionTitle}>Alocação</Text>
          <View style={styles.allocationChart}>
            <View style={styles.allocationBar}>
              {categoryAllocations.map((category, index) => {
                const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];
                const color = colors[index % colors.length];

                return (
                  <View
                    key={category.type}
                    style={[
                      styles.allocationBarFill,
                      { width: `${category.percentage}%`, backgroundColor: color }
                    ]}
                  />
                );
              })}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.allocationLegend}
            >
              {categoryAllocations.map((category, index) => {
                const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];
                const color = colors[index % colors.length];

                return (
                  <View key={category.type} style={styles.allocationLegendItem}>
                    <View style={[styles.allocationDot, { backgroundColor: color }]} />
                    <Text style={styles.allocationLabel}>{category.label} {formatPercent(category.percentage)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* FILTROS */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterGrid}
          >
            {Object.entries(filterMap).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterCard, selectedFilter.includes(key) && styles.filterCardActive]}
                onPress={() => {
                  setSelectedFilter(prev =>
                    prev.includes(key)
                      ? prev.filter(f => f !== key)
                      : [...prev, key]
                  );
                }}
              >
                <Text style={styles.filterCardIcon}>
                  {key === 'acao' || key === 'stock' ? '📈' :
                   key === 'fii' || key === 'reit' ? '🏢' :
                   key === 'etf' ? '📊' : '💰'}
                </Text>
                <Text style={[styles.filterCardText, selectedFilter.includes(key) && styles.filterCardTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TOP PERFORMERS */}
        <View style={styles.performersSection}>
          <View style={styles.performerHeader}>
            <Text style={styles.performerTitle}>🏆 Melhores</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Portfolio')}>
              <Text style={styles.seeAllButton}>Ver todos →</Text>
            </TouchableOpacity>
          </View>

          {topPerformers.map((asset, index) => (
            <TouchableOpacity
              key={asset.id}
              style={styles.assetCard}
              onPress={() => navigation.navigate('AssetDetail', { asset })}
              activeOpacity={0.7}
            >
              <View style={styles.assetCardLeft}>
                <View style={styles.assetRank}>
                  <Text style={styles.assetRankText}>{index + 1}</Text>
                </View>
                <View style={styles.assetInfo}>
                  <View style={styles.assetTitleRow}>
                    <Text style={styles.assetTicker}>{asset.ticker}</Text>
                    {asset.isMock && <Text style={styles.mockBadge}>📍</Text>}
                  </View>
                  <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
                </View>
              </View>
              <View style={styles.assetCardRight}>
                <Text style={styles.assetPrice}>{formatCurrency(asset.currentPriceReal)}</Text>
                <View style={[
                  styles.assetProfitBadge,
                  { backgroundColor: asset.profit >= 0 ? colors.success + '15' : colors.danger + '15' }
                ]}>
                  <Text style={[
                    styles.assetProfitText,
                    { color: asset.profit >= 0 ? colors.success : colors.danger }
                  ]}>
                    {asset.profit >= 0 ? '+' : ''}{formatPercent(asset.profitPercent)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* WORST PERFORMERS */}
        {worstPerformers[0]?.profit < 0 && (
          <View style={styles.performersSection}>
            <Text style={styles.performerTitle}>📉 Atenção</Text>

            {worstPerformers.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={styles.assetCard}
                onPress={() => navigation.navigate('AssetDetail', { asset })}
                activeOpacity={0.7}
              >
                <View style={styles.assetCardLeft}>
                  <View style={styles.assetRank}>
                    <Text style={styles.assetRankText}>⚠️</Text>
                  </View>
                  <View style={styles.assetInfo}>
                    <View style={styles.assetTitleRow}>
                      <Text style={styles.assetTicker}>{asset.ticker}</Text>
                      {asset.isMock && <Text style={styles.mockBadge}>📍</Text>}
                    </View>
                    <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
                  </View>
                </View>
                <View style={styles.assetCardRight}>
                  <Text style={styles.assetPrice}>{formatCurrency(asset.currentPriceReal)}</Text>
                  <View style={[styles.assetProfitBadge, { backgroundColor: colors.danger + '15' }]}>
                    <Text style={[styles.assetProfitText, { color: colors.danger }]}>
                      {formatPercent(asset.profitPercent)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AÇÕES RÁPIDAS */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleNewTransaction}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionText}>Nova Transação</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Analysis')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Análise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Watchlist')}
            >
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={styles.quickActionText}>Favoritos</Text>
            </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={handleManualRefresh}
              >
                <Text style={styles.quickActionIcon}>🔄</Text>
                <Text style={styles.quickActionText}>Atualizar</Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* STATUS */}
        {lastUpdate && (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {errorCount > 0 && (
              <Text style={styles.statusWarning}>
                {errorCount} ativo(s) usando dados simulados 📍
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <TransactionModal
        visible={transactionModalVisible}
        onClose={handleTransactionAdded}
        onTransactionAdded={handleTransactionAdded}
        portfolio={portfolio}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // HERO SECTION
  heroSection: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  heroValueContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroProfitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroProfitBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroProfitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  quickStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ALOCAÇÃO
  allocationSection: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  allocationChart: {
    backgroundColor: colors.surface,
    padding: 20,
    paddingBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allocationBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  allocationBarFill: {
    height: '100%',
  },
  allocationLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  allocationLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  allocationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // FILTROS
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  filterCard: {
    width: 80,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  filterCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterCardTextActive: {
    color: '#ffffff',
  },

  // PERFORMERS
  performersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  performerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  performerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // ASSET CARD
  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  assetInfo: {
    flex: 1,
  },
  assetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assetTicker: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginRight: 6,
  },
  mockBadge: {
    fontSize: 12,
  },
  assetName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  assetCardRight: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  assetProfitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assetProfitText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // QUICK ACTIONS
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 56) / 2,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  // INVESTIMENTO EM USD
  usdInvestmentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  usdInvestmentCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usdInvestmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  usdInvestmentSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  usdInvestmentValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usdInvestmentValue: {
    flex: 1,
    alignItems: 'center',
  },
  usdInvestmentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  usdInvestmentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  usdInvestmentDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  // STATUS
  statusSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusWarning: {
    fontSize: 12,
    color: colors.warning,
  },
});

export default DashboardScreen;
