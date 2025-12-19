import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAssetPrice } from '../../services/useAssetPrice';
import colors from '../../styles/colors';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import PriceChart from '../../components/common/PriceChart';
import CreateAlertModal from '../../components/alerts/CreateAlertModal';

const AssetDetailScreen = ({ route, navigation }) => {
  const { asset } = route.params;

  // Usando o custom hook para gerenciar o estado do preço
  const { realAsset, priceLoading, priceError, refreshPrice } = useAssetPrice(asset);

  const [chartPeriod, setChartPeriod] = useState(30);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrice();
    setIsRefreshing(false);
  };

  // Calcular dados do ativo
  const assetData = useMemo(() => {
    const quantity = realAsset.quantity || 0;
    const avgPrice = realAsset.avgPrice || 0;
    const currentPrice = realAsset.currentPrice || 0;

    const invested = quantity * avgPrice;
    const current = quantity * currentPrice;
    const profit = current - invested;
    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
    const isPositive = profit >= 0;

    return {
      invested,
      current,
      profit,
      profitPercent,
      isPositive,
    };
  }, [realAsset]);

  const handleBuy = () => {
    Alert.alert('Em Desenvolvimento', `A funcionalidade de compra para ${realAsset.ticker} ainda não foi implementada.`, [
      { text: 'OK' }
    ]);
  };

  const handleSell = () => {
    Alert.alert('Em Desenvolvimento', `A funcionalidade de venda para ${realAsset.ticker} ainda não foi implementada.`, [
      { text: 'OK' }
    ]);
  };

  const handleAddToWatchlist = () => {
    Alert.alert('💫 Em breve', 'Funcionalidade de Watchlist será adicionada em breve', [
      { text: 'OK' }
    ]);
  };

  const handleCreateAlert = () => {
    setAlertModalVisible(true);
  };

  const renderFundamentals = () => {
    const fundamentals = realAsset.fundamentals;
    if (!fundamentals) return null;

    const isFII = realAsset.type === 'FII';

    const getFormattedValue = (value, isPercent = false) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A';
      const formatted = (value || 0).toFixed(2);
      return isPercent ? `${formatted}%` : formatted;
    };

    const getValueColor = (label, value) => {
      if (typeof value !== 'number' || isNaN(value)) return colors.textSecondary;

      switch (label) {
        case 'P/L':
          return value < 15 ? colors.success : value < 25 ? colors.warning : colors.danger;
        case 'P/VP':
          return value < 1.5 ? colors.success : value < 2.5 ? colors.warning : colors.danger;
        case 'DY':
          return value > 5 ? colors.success : value > 3 ? colors.warning : colors.danger;
        case 'ROE':
          return value > 15 ? colors.success : value > 10 ? colors.warning : colors.danger;
        case 'Dív. Líq/EBITDA':
          return value < 3 ? colors.success : value < 5 ? colors.warning : colors.danger;
        case 'Liq. Corrente':
          return value > 1.5 ? colors.success : value > 1 ? colors.warning : colors.danger;
        case 'Marg. Líquida':
          return value > 10 ? colors.success : value > 5 ? colors.warning : colors.danger;
        case 'Vacância':
          return value < 5 ? colors.success : value < 10 ? colors.warning : colors.danger;
        default:
          return colors.text;
      }
    };

    const fundamentalItems = [
      { label: 'P/L', value: fundamentals.pl, isPercent: false, show: !isFII },
      { label: 'P/VP', value: fundamentals.pvp, isPercent: false },
      { label: 'DY', value: fundamentals.dy, isPercent: true },
      { label: 'ROE', value: fundamentals.roe, isPercent: true, show: !isFII },
      { label: 'Dív. Líq/EBITDA', value: fundamentals.dividaLiquidaEbitda, isPercent: false, show: !isFII },
      { label: 'Liq. Corrente', value: fundamentals.liquidezCorrente, isPercent: false, show: !isFII },
      { label: 'Marg. Líquida', value: fundamentals.margemLiquida, isPercent: true, show: !isFII },
      { label: 'Vacância', value: fundamentals.vacancia, isPercent: true, show: isFII },
    ];

    return (
      <View style={styles.fundamentalsCard}>
        <View style={styles.fundamentalsHeader}>
          <Text style={styles.sectionTitle}>📊 Fundamentos</Text>
          <Text style={styles.fundamentalsSubtitle}>
            {isFII ? 'Indicadores do Fundo Imobiliário' : 'Indicadores Fundamentalistas'}
          </Text>
        </View>
        <View style={styles.fundamentalsGrid}>
          {fundamentalItems.map(item =>
            item.show !== false ? (
              <View key={item.label} style={styles.fundamentalItem}>
                <View style={styles.fundamentalIcon}>
                  <Text style={styles.fundamentalIconText}>
                    {item.label === 'P/L' ? '💰' :
                     item.label === 'P/VP' ? '📈' :
                     item.label === 'DY' ? '💎' :
                     item.label === 'ROE' ? '⚡' :
                     item.label === 'Dív. Líq/EBITDA' ? '🏦' :
                     item.label === 'Liq. Corrente' ? '💧' :
                     item.label === 'Marg. Líquida' ? '📊' :
                     item.label === 'Vacância' ? '🏢' : '📋'}
                  </Text>
                </View>
                <View style={styles.fundamentalContent}>
                  <Text style={styles.fundamentalLabel}>{item.label}</Text>
                  <Text style={[styles.fundamentalValue, {
                    color: getValueColor(item.label, item.value)
                  }]}>
                    {getFormattedValue(item.value, item.isPercent)}
                  </Text>
                </View>
              </View>
            ) : null
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Ativo Info */}
        <View style={styles.assetInfo}>
          <View style={styles.assetHeader}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>
                {realAsset.type === 'Ação' ? '📈' : '🏢'}
              </Text>
            </View>
            <View style={styles.assetDetails}>
              <Text style={styles.ticker}>{realAsset.ticker}</Text>
              <Text style={styles.name}>{realAsset.name}</Text>
              <Text style={styles.sector}>{realAsset.sector}</Text>
            </View>
          </View>

          {/* Preços */}
          <View style={styles.pricesContainer}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Preço Médio</Text>
              <Text style={styles.price}>{formatCurrency(realAsset.avgPrice)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Preço Atual</Text>
              <View style={styles.currentPriceContainer}>
                <Text style={[styles.price, { color: colors.primary }]}>
                  {formatCurrency(realAsset.currentPrice)}
                </Text>
                {priceLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                ) : priceError ? (
                  <View style={styles.errorIndicator}>
                    <Text style={styles.errorText}>⚠️</Text>
                  </View>
                ) : (
                  realAsset.changePercent !== 0 && (
                    <View style={[styles.changeIndicator, {
                      backgroundColor: realAsset.changePercent >= 0 ? colors.success + '20' : colors.danger + '20',
                    }]}>
                      <Text style={[styles.changeText, {
                        color: realAsset.changePercent >= 0 ? colors.success : colors.danger
                      }]}>
                        {realAsset.changePercent >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(realAsset.changePercent))}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>

          {priceError && (
            <Text style={styles.priceErrorText}>{priceError}</Text>
          )}

          {/* Quantidade */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantidade em Portfólio</Text>
            <Text style={styles.quantity}>{realAsset.quantity} unidades</Text>
          </View>
        </View>

        {/* Resumo de Lucro/Prejuízo */}
        <View style={[styles.summaryCard, {
          backgroundColor: assetData.isPositive ? colors.success + '10' : colors.danger + '10',
          borderColor: assetData.isPositive ? colors.success : colors.danger,
        }]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Resumo do Investimento</Text>
            <View style={[styles.profitIndicator, {
              backgroundColor: assetData.isPositive ? colors.success : colors.danger,
            }]}>
              <Text style={styles.profitIndicatorText}>
                {assetData.isPositive ? '📈' : '📉'} {assetData.isPositive ? 'Lucro' : 'Prejuízo'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor Investido</Text>
              <Text style={styles.summaryValueLarge}>{formatCurrency(assetData.invested)}</Text>
            </View>
            <View style={styles.summarySeparator} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor Atual</Text>
              <Text style={styles.summaryValueLarge}>{formatCurrency(assetData.current)}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lucro/Prejuízo</Text>
              <Text style={[styles.summaryValueLarge, {
                color: assetData.isPositive ? colors.success : colors.danger
              }]}>
                {formatCurrency(Math.abs(assetData.profit))}
              </Text>
            </View>
            <View style={styles.summarySeparator} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Percentual</Text>
              <Text style={[styles.summaryValueLarge, {
                color: assetData.isPositive ? colors.success : colors.danger
              }]}>
                {assetData.isPositive ? '▲' : '▼'} {formatPercent(Math.abs(assetData.profitPercent))}
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico */}
        <PriceChart asset={realAsset} period={chartPeriod} />

        {/* Seletor de Período */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 7 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(7)}
          >
            <Text style={[styles.periodText, chartPeriod === 7 && styles.periodTextActive]}>
              7D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 30 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(30)}
          >
            <Text style={[styles.periodText, chartPeriod === 30 && styles.periodTextActive]}>
              30D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 90 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(90)}
          >
            <Text style={[styles.periodText, chartPeriod === 90 && styles.periodTextActive]}>
              90D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 365 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(365)}
          >
            <Text style={[styles.periodText, chartPeriod === 365 && styles.periodTextActive]}>
              1A
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fundamentals */}
        {renderFundamentals()}

        {/* Botões de Ação */}
        <View style={styles.actionsContainer}>
          <View style={styles.primaryActionsRow}>
            <TouchableOpacity
              style={[styles.primaryActionButton, styles.buyButton]}
              onPress={handleBuy}
              disabled={priceLoading}
              activeOpacity={0.8}
            >
              {priceLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIconContainer}>
                    <Text style={styles.actionButtonIcon}>💰</Text>
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.primaryButtonText}>Comprar</Text>
                    <Text style={styles.buttonSubtitle}>Adicionar ao portfólio</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryActionButton, styles.sellButton]}
              onPress={handleSell}
              disabled={priceLoading}
              activeOpacity={0.8}
            >
              {priceLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIconContainer}>
                    <Text style={styles.actionButtonIcon}>💸</Text>
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.primaryButtonText}>Vender</Text>
                    <Text style={styles.buttonSubtitle}>Remover do portfólio</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={[styles.secondaryActionButton, styles.watchlistButton]}
              onPress={handleAddToWatchlist}
              disabled={priceLoading}
              activeOpacity={0.7}
            >
              <View style={styles.secondaryButtonContent}>
                <Text style={styles.secondaryButtonIcon}>⭐</Text>
                <Text style={styles.secondaryButtonText}>Favoritar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionButton, styles.alertButton]}
              onPress={() => setAlertModalVisible(true)}
              disabled={priceLoading}
              activeOpacity={0.7}
            >
              <View style={styles.secondaryButtonContent}>
                <Text style={styles.secondaryButtonIcon}>🔔</Text>
                <Text style={styles.secondaryButtonText}>Criar Alerta</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal de Criação de Alerta */}
      <CreateAlertModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        asset={realAsset}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  assetInfo: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    // Shadow for iOS
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 4,
  },
  icon: {
    fontSize: 36,
  },
  assetDetails: {
    flex: 1,
  },
  ticker: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  sector: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pricesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  priceBox: {
    flex: 1,
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    backgroundColor: colors.warning + '30',
  },
  errorText: {
    fontSize: 12,
    color: colors.warning,
  },
  priceErrorText: {
    color: colors.warning,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  quantityContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  quantityLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  quantity: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  profitIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profitIndicatorText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryValueLarge: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  summarySeparator: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  periodTextActive: {
    color: colors.text,
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryActionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  buttonSubtitle: {
    color: colors.text + 'CC',
    fontSize: 12,
    fontWeight: '500',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: colors.success,
  },
  sellButton: {
    backgroundColor: colors.danger,
  },
  watchlistButton: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  alertButton: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  fundamentalsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  fundamentalsHeader: {
    marginBottom: 20,
  },
  fundamentalsSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fundamentalItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundamentalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fundamentalIconText: {
    fontSize: 18,
  },
  fundamentalContent: {
    flex: 1,
  },
  fundamentalLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  fundamentalValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssetDetailScreen;
