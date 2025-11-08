import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { mockPortfolio } from '../../data/mockAssets';
import { watchlistService } from '../../services/watchlistService';
import AssetCard from '../../components/common/AssetCard';

const WatchlistScreen = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Carregar watchlist ao montar
  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('Erro ao carregar watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
  };

  // Filtrar e buscar
  const filteredWatchlist = useMemo(() => {
    let filtered = mockPortfolio.filter(asset => watchlist.includes(asset.ticker));

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(
        asset =>
          asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    return filtered;
  }, [watchlist, searchQuery, filterType]);

  // Remover da watchlist
  const handleRemoveFromWatchlist = async (ticker) => {
    Alert.alert(
      'Remover Favorito',
      `Deseja remover ${ticker} da watchlist?`,
      [
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Remover',
          onPress: async () => {
            setLoading(true);
            try {
              await watchlistService.removeFromWatchlist(ticker);
              await loadWatchlist();
              Alert.alert('Sucesso', `${ticker} removido da watchlist`);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o ativo');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Calcular totais
  const totals = useMemo(() => {
    const invested = filteredWatchlist.reduce(
      (sum, asset) => sum + asset.quantity * asset.avgPrice,
      0
    );
    const current = filteredWatchlist.reduce(
      (sum, asset) => sum + asset.quantity * asset.currentPrice,
      0
    );
    const profit = current - invested;
    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

    return { invested, current, profit, profitPercent };
  }, [filteredWatchlist]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando watchlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Minha Watchlist</Text>
        <Text style={styles.subtitle}>
          {watchlist.length} favorito{watchlist.length !== 1 ? 's' : ''}
        </Text>
      </View>

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
        {watchlist.length === 0 ? (
          // Estado vazio
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>Nenhum Favorito</Text>
            <Text style={styles.emptyText}>
              Adicione ativos à sua watchlist para acompanhá-los aqui
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.summaryContainer}
              contentContainerStyle={styles.summaryContent}
            >
              <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.summaryLabel}>Total Investido</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totals.invested)}
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.secondary }]}>
                <Text style={styles.summaryLabel}>Valor Atual</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totals.current)}
                </Text>
              </View>

              <View style={[styles.summaryCard, {
                backgroundColor: totals.profit >= 0 ? colors.success : colors.danger
              }]}>
                <Text style={styles.summaryLabel}>Lucro/Prejuízo</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(Math.abs(totals.profit))}
                </Text>
                <Text style={styles.summaryPercent}>
                  {totals.profitPercent >= 0 ? '+' : ''}{totals.profitPercent.toFixed(2)}%
                </Text>
              </View>
            </ScrollView>

            <View style={styles.content}>
              {/* Busca */}
              <View style={styles.controlsContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar favorito..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Filtros */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersRow}
                contentContainerStyle={styles.filtersContent}
              >
                <TouchableOpacity
                  style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
                    Todos ({watchlist.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, filterType === 'Ação' && styles.filterChipActive]}
                  onPress={() => setFilterType('Ação')}
                >
                  <Text style={[styles.filterText, filterType === 'Ação' && styles.filterTextActive]}>
                    Ações ({mockPortfolio.filter(a => a.type === 'Ação' && watchlist.includes(a.ticker)).length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, filterType === 'FII' && styles.filterChipActive]}
                  onPress={() => setFilterType('FII')}
                >
                  <Text style={[styles.filterText, filterType === 'FII' && styles.filterTextActive]}>
                    FIIs ({mockPortfolio.filter(a => a.type === 'FII' && watchlist.includes(a.ticker)).length})
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Lista de Favoritos */}
              <View style={styles.listContainer}>
                {filteredWatchlist.length === 0 ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsIcon}>🔍</Text>
                    <Text style={styles.noResultsTitle}>Nenhum resultado</Text>
                    <Text style={styles.noResultsText}>
                      Tente ajustar os filtros ou busca
                    </Text>
                  </View>
                ) : (
                  filteredWatchlist.map(asset => (
                    <View key={asset.id} style={styles.assetContainer}>
                      <AssetCard
                        asset={asset}
                        onPress={() =>
                          navigation.navigate('AssetDetail', { asset })
                        }
                      />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveFromWatchlist(asset.ticker)}
                      >
                        <Text style={styles.removeIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </>
        )}

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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
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
  summaryContainer: {
    paddingLeft: 20,
    marginVertical: 20,
  },
  summaryContent: {
    paddingRight: 20,
  },
  summaryCard: {
    width: 150,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  summaryLabel: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryPercent: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  content: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  filtersRow: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  assetContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noResults: {
    alignItems: 'center',
    marginTop: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noResultsText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default WatchlistScreen;
