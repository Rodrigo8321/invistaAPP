import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { marketService } from '../../services/marketService';

const AssetAnalysisScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Dados mockados para demonstração
  const mockAssetData = {
    symbol: 'PETR4',
    name: 'Petrobras PN',
    price: 32.45,
    change: 2.15,
    changePercent: 7.08,
    volume: '45.2M',
    marketCap: 'R$ 285.6B',
    sector: 'Petróleo e Gás',
    fundamentals: {
      pe: 8.45,
      pb: 1.23,
      ps: 0.89,
      evEbitda: 4.56,
      roe: 14.5,
      roa: 8.2,
      debtToEquity: 0.45,
      currentRatio: 1.8,
      dividendYield: 12.3,
      beta: 1.15,
    },
    balance: {
      totalAssets: 'R$ 1.2T',
      totalLiabilities: 'R$ 890B',
      shareholdersEquity: 'R$ 310B',
      cashAndEquivalents: 'R$ 45B',
      netDebt: 'R$ 245B',
    },
    income: {
      revenue: 'R$ 1.8T',
      grossProfit: 'R$ 456B',
      operatingIncome: 'R$ 234B',
      netIncome: 'R$ 189B',
      ebitda: 'R$ 345B',
    }
  };

  const searchAssets = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    try {
      // Simular busca de ativos
      const mockResults = [
        { symbol: 'PETR4', name: 'Petrobras PN', type: 'Ação' },
        { symbol: 'VALE3', name: 'Vale ON', type: 'Ação' },
        { symbol: 'ITUB4', name: 'Itaú PN', type: 'Ação' },
        { symbol: 'BBDC4', name: 'Bradesco PN', type: 'Ação' },
        { symbol: 'WEGE3', name: 'WEG ON', type: 'Ação' },
      ].filter(asset =>
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Erro na busca:', error);
      Alert.alert('Erro', 'Não foi possível buscar ativos');
    } finally {
      setLoading(false);
    }
  };

  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    setAssetData(mockAssetData);
    setSearchQuery(asset.symbol);
    setShowSearchResults(false);
  };

  const clearSelection = () => {
    setSelectedAsset(null);
    setAssetData(null);
    setSearchQuery('');
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchAssets(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Análise de Ativos</Text>
          <Text style={styles.subtitle}>Análise completa de ações e fundos</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ativo (ex: PETR4, VALE3)..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
            />
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {selectedAsset && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((asset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchResultItem}
                onPress={() => selectAsset(asset)}
              >
                <View style={styles.assetInfo}>
                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetName}>{asset.name}</Text>
                </View>
                <Text style={styles.assetType}>{asset.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Asset Information */}
        {assetData && (
          <>
            {/* Asset Header */}
            <View style={styles.assetHeader}>
              <View style={styles.assetMainInfo}>
                <Text style={styles.assetSymbolLarge}>{assetData.symbol}</Text>
                <Text style={styles.assetNameLarge}>{assetData.name}</Text>
                <Text style={styles.assetSector}>{assetData.sector}</Text>
              </View>
              <View style={styles.assetPriceInfo}>
                <Text style={styles.currentPrice}>R$ {((assetData.price || 0)).toFixed(2)}</Text>
                <Text style={[
                  styles.priceChange,
                  { color: (assetData.change || 0) >= 0 ? colors.success : colors.danger }
                ]}>
                  {(assetData.change || 0) >= 0 ? '+' : ''}{(assetData.change || 0).toFixed(2)} ({(assetData.changePercent || 0).toFixed(2)}%)
                </Text>
                <Text style={styles.volume}>Vol: {assetData.volume}</Text>
              </View>
            </View>

            {/* Fundamentals Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Indicadores Fundamentalistas</Text>
              <View style={styles.fundamentalsGrid}>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>P/L</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.pe || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>P/VP</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.pb || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>P/S</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.ps || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>EV/EBITDA</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.evEbitda || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>ROE</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.roe || 0).toFixed(1)}%</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>ROA</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.roa || 0).toFixed(1)}%</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>Dívida/PL</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.debtToEquity || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.fundamentalItem}>
                  <Text style={styles.fundamentalLabel}>Dividend Yield</Text>
                  <Text style={styles.fundamentalValue}>{(assetData.fundamentals?.dividendYield || 0).toFixed(1)}%</Text>
                </View>
              </View>
            </View>

            {/* Balance Sheet Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏦 Balanço Patrimonial</Text>
              <View style={styles.balanceGrid}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Ativo Total</Text>
                  <Text style={styles.balanceValue}>{assetData.balance.totalAssets}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Passivo Total</Text>
                  <Text style={styles.balanceValue}>{assetData.balance.totalLiabilities}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Patrimônio Líquido</Text>
                  <Text style={styles.balanceValue}>{assetData.balance.shareholdersEquity}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Caixa e Equivalentes</Text>
                  <Text style={styles.balanceValue}>{assetData.balance.cashAndEquivalents}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Dívida Líquida</Text>
                  <Text style={styles.balanceValue}>{assetData.balance.netDebt}</Text>
                </View>
              </View>
            </View>

            {/* Income Statement Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💰 Demonstração de Resultados</Text>
              <View style={styles.incomeGrid}>
                <View style={styles.incomeItem}>
                  <Text style={styles.incomeLabel}>Receita Líquida</Text>
                  <Text style={styles.incomeValue}>{assetData.income.revenue}</Text>
                </View>
                <View style={styles.incomeItem}>
                  <Text style={styles.incomeLabel}>Lucro Bruto</Text>
                  <Text style={styles.incomeValue}>{assetData.income.grossProfit}</Text>
                </View>
                <View style={styles.incomeItem}>
                  <Text style={styles.incomeLabel}>EBITDA</Text>
                  <Text style={styles.incomeValue}>{assetData.income.ebitda}</Text>
                </View>
                <View style={styles.incomeItem}>
                  <Text style={styles.incomeLabel}>Lucro Líquido</Text>
                  <Text style={styles.incomeValue}>{assetData.income.netIncome}</Text>
                </View>
              </View>
            </View>

            {/* Chart Placeholder */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📈 Gráfico de Preços</Text>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>📊 Gráfico será implementado</Text>
                <Text style={styles.chartPlaceholderSubtext}>
                  Filtros: 1D, 5D, 1M, 3M, 6M, 1A, 5A
                </Text>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📝 Anotações Pessoais</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Adicione suas observações sobre este ativo..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.saveNotesButton}>
                <Text style={styles.saveNotesButtonText}>Salvar Anotações</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Empty State */}
        {!selectedAsset && !showSearchResults && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Buscar Ativo</Text>
            <Text style={styles.emptyText}>
              Digite o código do ativo (ex: PETR4) ou nome da empresa para começar a análise
            </Text>
          </View>
        )}

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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.danger + '20',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  searchResults: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  assetName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  assetType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetMainInfo: {
    flex: 1,
  },
  assetSymbolLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  assetNameLarge: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  assetSector: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  assetPriceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  volume: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fundamentalItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fundamentalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fundamentalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  balanceGrid: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  incomeGrid: {
    gap: 12,
  },
  incomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  incomeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  incomeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  saveNotesButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveNotesButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AssetAnalysisScreen;
