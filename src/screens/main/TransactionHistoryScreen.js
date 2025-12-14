import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transactionService } from '../../services/transactionService';
import TransactionCard from '../../components/transactions/TransactionCard';
import AddAssetModal from '../../components/transactions/AddAssetModal';
import TransactionModal from '../../components/transactions/TransactionModal'; // 1. Importar o modal de transações
import { usePortfolio } from '../../contexts/PortfolioContext';

const TransactionHistoryScreen = ({ route, navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddAssetModalVisible, setIsAddAssetModalVisible] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false); // 2. Estado para o novo modal
  const { portfolio, addAsset, reloadPortfolio } = usePortfolio(); // 3. Obter o portfólio

  const [filterType, setFilterType] = useState('Compra');
  const [filterPeriod, setFilterPeriod] = useState('todos');

  useEffect(() => {
    loadTransactions();
    
    // Verifica se deve abrir modal automaticamente
    if (route.params?.openModal) {
      setTimeout(() => {
        setIsAddAssetModalVisible(true);
      }, 500); // Pequeno delay para garantir que a tela carregou
    }
  }, [route.params]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    await reloadPortfolio(); // <-- Recarrega o portfólio no "pull-to-refresh"
    setRefreshing(false);
  };

  const handleDeleteTransaction = async (transactionId) => {
    Alert.alert(
      'Deletar Transação',
      'Deseja realmente deletar esta transação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          onPress: async () => {
            try {
              await transactionService.deleteTransaction(transactionId);
              await loadTransactions();
              await reloadPortfolio(); // <-- Recarrega o portfólio após deletar
              Alert.alert('✅ Sucesso', 'Transação deletada com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível deletar a transação');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleRemoveAsset = async (ticker) => {
    Alert.alert(
      '⚠️ Remover Ativo Permanentemente',
      `Você tem certeza que deseja remover o ativo "${ticker}" e TODAS as suas transações? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover Ativo',
          onPress: async () => {
            try {
              await transactionService.removeAssetByTicker(ticker);
              await onRefresh(); // Recarrega transações e portfólio
              Alert.alert('✅ Sucesso', `Ativo ${ticker} foi removido.`);
            } catch (error) {
              Alert.alert('Erro', `Não foi possível remover o ativo ${ticker}.`);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleOpenAddMenu = () => {
    Alert.alert(
      'Nova Operação',
      'O que você gostaria de registrar?',
      [
        {
          text: 'Adicionar Novo Ativo',
          onPress: () => setIsAddAssetModalVisible(true),
        },
        {
          text: 'Registrar Compra/Venda',
          onPress: () => setIsTransactionModalVisible(true),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddAsset = async (newAsset) => {
    try {
      await addAsset(newAsset);
      setIsAddAssetModalVisible(false);
      await reloadPortfolio();
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o novo ativo.');
    }
  };

  // 4. Função para lidar com a adição de uma NOVA TRANSAÇÃO (compra/venda)
  const handleTransactionAdded = async () => {
    setIsTransactionModalVisible(false); // Fecha o modal de transação
    await loadTransactions(); // Recarrega a lista de transações
    await reloadPortfolio(); // Recalcula o portfólio
    Alert.alert('✅ Sucesso', 'Nova transação registrada!');
  };

  const filtered = useMemo(() => {
    let result = [...transactions];
    result = transactionService.filterByType(result, filterType);
    result = transactionService.filterByPeriod(result, filterPeriod);
    result = transactionService.sortByDate(result);
    return result;
  }, [transactions, filterType, filterPeriod]);

  const totals = useMemo(() => {
    return transactionService.calculateTotals(filtered);
  }, [filtered]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando transações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Histórico de Transações</Text>
        <Text style={styles.subtitle}>
          Total: {transactions.length} transação{transactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Botões de Ação - Movidos para fora da condição para estarem sempre visíveis */}
      <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={[styles.newButton, { backgroundColor: colors.primary }]}
        onPress={handleOpenAddMenu}
      >
        <Text style={styles.newButtonIcon}>➕</Text>
        <Text style={styles.newButtonText}>Nova Operação</Text>
      </TouchableOpacity>
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
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhuma Transação</Text>
            <Text style={styles.emptyText}>
              Comece criando sua primeira transação
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.summaryContainer}
              contentContainerStyle={styles.summaryContent}
            >
              <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.summaryLabel}>Total Comprado</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totals.totalBought)}
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.secondary }]}>
                <Text style={styles.summaryLabel}>Total Vendido</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totals.totalSold)}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: totals.totalProfit >= 0 ? colors.success : colors.danger },
                ]}>
                <Text style={styles.summaryLabel}>Lucro/Prejuízo</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(Math.abs(totals.totalProfit))}
                </Text>
                <Text style={styles.summaryPercent}>
                  {totals.profitPercent >= 0 ? '+' : ''}{totals.profitPercent.toFixed(2)}%
                </Text>
              </View>
            </ScrollView>

            <View style={styles.content}>
              <View style={styles.filterSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filtersRow}
                  contentContainerStyle={styles.filtersContent}
                >
                  <TouchableOpacity
                    style={[styles.filterChip, filterType === 'Compra' && styles.filterChipActive]}
                    onPress={() => setFilterType('Compra')}
                  >
                    <Text style={[styles.filterText, filterType === 'Compra' && styles.filterTextActive]}>
                      ✅ Compras
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, filterType === 'Venda' && styles.filterChipActive]}
                    onPress={() => setFilterType('Venda')}
                  >
                    <Text style={[styles.filterText, filterType === 'Venda' && styles.filterTextActive]}>
                      📊 Vendas
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Período:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filtersRow}
                  contentContainerStyle={styles.filtersContent}
                >
                  <TouchableOpacity
                    style={[styles.filterChip, filterPeriod === 'mes' && styles.filterChipActive]}
                    onPress={() => setFilterPeriod('mes')}
                  >
                    <Text style={[styles.filterText, filterPeriod === 'mes' && styles.filterTextActive]}>
                      30 dias
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, filterPeriod === 'trimestre' && styles.filterChipActive]}
                    onPress={() => setFilterPeriod('trimestre')}
                  >
                    <Text style={[styles.filterText, filterPeriod === 'trimestre' && styles.filterTextActive]}>
                      90 dias
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, filterPeriod === 'ano' && styles.filterChipActive]}
                    onPress={() => setFilterPeriod('ano')}
                  >
                    <Text style={[styles.filterText, filterPeriod === 'ano' && styles.filterTextActive]}>
                      1 ano
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, filterPeriod === 'todos' && styles.filterChipActive]}
                    onPress={() => setFilterPeriod('todos')}
                  >
                    <Text style={[styles.filterText, filterPeriod === 'todos' && styles.filterTextActive]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <View style={styles.listContainer}>
                {filtered.length === 0 ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsIcon}>🔍</Text>
                    <Text style={styles.noResultsTitle}>Nenhuma transação</Text>
                    <Text style={styles.noResultsText}>
                      Ajuste os filtros ou crie uma nova transação
                    </Text>
                  </View>
                ) : (
                  filtered.map(transaction => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onDelete={handleDeleteTransaction}
                      onRemoveAsset={handleRemoveAsset}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal para ADICIONAR um novo ativo */}
      <AddAssetModal
        visible={isAddAssetModalVisible}
        onClose={() => setIsAddAssetModalVisible(false)}
        onAddAsset={handleAddAsset}
      />

      {/* 6. Modal para REGISTRAR uma transação (compra/venda) */}
      <TransactionModal
        visible={isTransactionModalVisible}
        onClose={() => setIsTransactionModalVisible(false)}
        onTransactionAdded={handleTransactionAdded}
        portfolio={portfolio}
      />
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  newButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  newButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  newButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  filtersRow: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
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
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  listContainer: {
    marginBottom: 20,
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
