import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { colors } from '../../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePortfolio } from '../../contexts/PortfolioContext'; // 1. Usar o contexto do portfólio
import { fetchQuote, fetchExchangeRate } from '../../services/marketService'; // 2. Importar fetchQuote
import TransactionModal from '../../components/transactions/TransactionModal';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  // 3. Obter dados reais do contexto em vez de mock
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realPrices, setRealPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(5.0);
  const [selectedFilter, setSelectedFilter] = useState(['acao']); // array of filters

  // 4. Função para buscar dados em tempo real
  const loadRealData = async (showLoader = true) => {
    if (!portfolio || portfolio.length === 0) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (showLoader) setLoading(true);

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
    setLoading(false);
    setRefreshing(false);
  };

  // Assets com dados reais
  const assetsWithRealPrices = useMemo(() => {
    return portfolio.map(asset => {
      const realPrice = realPrices[asset.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
      const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
      const invested = asset.averagePrice * asset.quantity;
      const current = priceInBRL * asset.quantity;
      const profit = current - invested;
      const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

      return {
        ...asset,
        currentPriceReal: priceInBRL,
        profit,
        profitPercent,
        weeklyChange: realPrice?.changePercent || 0, // Usar a variação diária como fallback
        isMock: realPrice?.isMock || false,
      };
    }); // Removido weeklyStartPrices
  }, [portfolio, realPrices, exchangeRate]);

  // Cards que mostram os três melhores ativos de cada segmento (ação, fii, crypto)
  // Defensive fix: add default empty array in case assetsWithRealPrices is undefined
  const topThreeAssetsBySegment = useMemo(() => {
    const segments = ['acao', 'fii', 'crypto'];
    const topThreeAssets = {};

    segments.forEach(segment => {
      const filteredAssets = (assetsWithRealPrices || []).filter(a =>
        a.type && a.type.toLowerCase().replace('ção', 'cao') === segment
      );
      // Ordena por variação semanal e pega os três primeiros
      const sorted = filteredAssets.sort((a, b) => b.weeklyChange - a.weeklyChange);
      topThreeAssets[segment] = sorted.slice(0, 3);
    });

    return topThreeAssets;
  }, [assetsWithRealPrices]);


  const filterMap = { acao: 'Ação', fii: 'FII', stock: 'Stock', reit: 'REIT', etf: 'ETF', crypto: 'Crypto' };
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionDateInput, setTransactionDateInput] = useState(null);

  // 5. Chamar a busca de dados quando o portfólio carregar
  useEffect(() => {
    if (!portfolioLoading) loadRealData();
  }, [portfolioLoading]);

  // ========== CÁLCULOS ==========
  const stats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalStocks = 0;
    let totalCrypto = 0;
    let totalInvestedUSD = 0;
    let dailyProfitBRL = 0;
    let totalMonthlyDividends = 0;

    portfolio.forEach(asset => {
      const realPrice = realPrices[asset.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
      const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;

      const invested = asset.averagePrice * asset.quantity;
      const current = priceInBRL * asset.quantity;

      totalInvested += invested;
      totalCurrent += current;

      // Soma os dividendos mensais de cada ativo
      totalMonthlyDividends += asset.monthlyDividends || 0;

      if (asset.type === 'Crypto') {
        totalCrypto += current;
      } else {
        totalStocks += current;
      }

      // Sum invested in USD for stocks, REITs, ETFs
      if (asset.currency === 'USD' && ['Stock', 'REIT', 'ETF'].includes(asset.type)) {
        totalInvestedUSD += invested;
        // Calcula a variação diária em BRL para ativos em USD
        const dailyChange = realPrice?.change || 0;
        dailyProfitBRL += dailyChange * asset.quantity * exchangeRate;
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
      dailyProfitBRL,
      totalMonthlyDividends,
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

  // Filtros
  const filteredAssetsLocal = useMemo(() => {
    let filtered = assetsWithRealPrices;

    if (selectedFilter.length > 0) {
      filtered = filtered.filter(a => selectedFilter.includes(a.type.toLowerCase().replace('ção', 'cao')));
    }

    return filtered.sort((a, b) => b.weeklyChange - a.weeklyChange);
  }, [assetsWithRealPrices, selectedFilter]);

  // Top 3 e Worst 3
  const topPerformers = filteredAssetsLocal.slice(0, 3);
  const worstPerformers = [...filteredAssetsLocal].reverse().slice(0, 3);

  // ========== LOADING STATE ==========
  if (loading || portfolioLoading) { // 6. Considerar o loading do contexto também
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

  const onRefresh = () => {
    setRefreshing(true);
    loadRealData(false); // 7. Chamar a função real no refresh
  };

  const handleManualRefresh = () => {
    onRefresh();
    Alert.alert('Atualizado', 'Os dados do portfólio foram atualizados.');
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* HERO SECTION - Portfolio Value */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroGreeting}>Olá! Investidor 👋</Text>
              <Text style={styles.heroSubtitle}>Seu patrimônio hoje</Text>
            </View>
          {/* Botão de acesso à configuração removido conforme solicitado */}
          {/*
          <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          */}
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
              <Text style={styles.quickStatLabel}>Dividendos (Mês)</Text>
              <Text style={styles.quickStatValue}>{formatCurrency(stats.totalMonthlyDividends)}</Text>
            </View>
          </View>
        </View>

        {/* INVESTIMENTO EM USD */}
        <View style={styles.usdInvestmentSection}>
          <View style={styles.usdInvestmentCard}>
            <Text style={styles.usdInvestmentTitle}>Investimento em DOLLAR</Text>
            <Text style={styles.usdInvestmentSubtitle}>STOCK´S, REITs e ETFs</Text>

            <View style={[
                styles.dailyChangeBadge,
                { backgroundColor: stats.dailyProfitBRL >= 0 ? colors.success + '20' : colors.danger + '20' }
              ]}>
                <Text style={[
                  styles.dailyChangeText,
                  { color: stats.dailyProfitBRL >= 0 ? colors.success : colors.danger }
                ]}>
                  Hoje: {stats.dailyProfitBRL >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(stats.dailyProfitBRL))}
                </Text>
              </View>

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


        {/* ALOCAÇÃO */}
        <View style={styles.allocationSection}>
          <Text style={styles.sectionTitle}>Alocação</Text>
          <View style={styles.allocationChart}>
            <View style={styles.allocationBar}>
              {categoryAllocations.map((category, index) => {
                const vibrantColors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#84CC16'];
                const color = vibrantColors[index % vibrantColors.length];

                return (
                  <View
                    key={category.type}
                    style={[
                      styles.allocationBarFill,
                      { width: `${category.percentage}%`, backgroundColor: color, marginRight: index < categoryAllocations.length - 1 ? 2 : 0 }
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
                const vibrantColors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#84CC16'];
                const color = vibrantColors[index % vibrantColors.length];

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

        {/* Cards que mostram os três melhores ativos de cada segmento */}
        <View style={styles.topCardsSection}>
          <Text style={styles.sectionTitle}>Top 3 Melhores Ativos por Segmento</Text>
          {Object.entries(topThreeAssetsBySegment).map(([segment, assets]) => (
            <View key={segment} style={styles.segmentGroup}>
              <Text style={styles.segmentTitle}>{segment.toUpperCase()}</Text>
              <View style={styles.topCardsContainer}>
                {assets.map((asset) => (
                  <TouchableOpacity
                    key={asset.ticker}
                    style={styles.topCard}
                    onPress={() => navigation.navigate('AssetDetail', { asset })}
                  >
                    <Text style={styles.topCardTicker}>{asset.ticker}</Text>
                    <Text numberOfLines={1} style={styles.topCardName}>{asset.name}</Text>
                    <Text style={styles.topCardProfit}>
                      {asset.profit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(asset.profit))}
                    </Text>
                    <Text style={[styles.topCardProfitPercent, { color: asset.profit >= 0 ? colors.success : colors.danger }]}>
                      {formatPercent(asset.profitPercent)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
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
                  <Text style={styles.assetRankText}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </Text>
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
                    {asset.profit >= 0 ? '▲' : '▼'} {asset.profit >= 0 ? '+' : ''}{formatPercent(asset.profitPercent)}
                  </Text>
                </View>
                <Text style={styles.assetWeeklyChange}>
                  Semana: {asset.weeklyChange >= 0 ? '+' : ''}{formatPercent(asset.weeklyChange)}
                </Text>
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
              onPress={() => navigation.navigate('PortfolioManagement')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Gestão de Portfólio</Text>
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

            <View style={{ height: 40 }} />
      </ScrollView>

          <TransactionModal
            visible={transactionModalVisible}
            onClose={handleTransactionAdded}
            onTransactionAdded={handleTransactionAdded}
            initialDateInput={transactionDateInput}
            portfolio={portfolio}
          />
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
    paddingBottom: 32,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
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
  usdInvestmentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
  topCardsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  segmentGroup: {
    marginBottom: 20,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topCardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  topCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 2,
  },
  topCardTicker: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  topCardName: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    numberOfLines: 2,
  },
  topCardProfit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  topCardProfitPercent: {
    fontSize: 12,
    fontWeight: '600',
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
  assetWeeklyChange: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
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
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 6,
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


  usdInvestmentCard: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    // Shadow for Android
    elevation: 20,
  },
  usdInvestmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF', // Letra branca para contraste
    marginBottom: 4,
  },
  usdInvestmentSubtitle: {
    fontSize: 14,
    color: '#94A3B8', // Tom de cinza claro
    marginBottom: 16,
  },
  usdInvestmentValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usdInvestmentValue: {
    alignItems: 'center',
  },
  usdInvestmentLabel: {
    fontSize: 12,
    color: '#94A3B8', // Tom de cinza claro
    marginBottom: 4,
  },
  usdInvestmentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF', // Letra branca para contraste
  },
  usdInvestmentDivider: {
    width: 1,
    backgroundColor: '#334155', // Cor do divisor
  },
  dailyChangeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  dailyChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },


});

export default DashboardScreen;
