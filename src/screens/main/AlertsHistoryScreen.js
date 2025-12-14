import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert as RNAlert
} from 'react-native';
import AlertService from '../../services/alertService';

const AlertsHistoryScreen = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alerts, historyData, statsData] = await Promise.all([
        AlertService.getAlerts(),
        AlertService.getHistory(),
        AlertService.getStats()
      ]);

      setActiveAlerts(alerts);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading alerts data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteAlert = (alertId) => {
    RNAlert.alert(
      'Excluir Alerta',
      'Tem certeza que deseja excluir este alerta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await AlertService.deleteAlert(alertId);
            await loadData();
          }
        }
      ]
    );
  };

  const handleClearHistory = () => {
    RNAlert.alert(
      'Limpar Histórico',
      'Deseja limpar todo o histórico de alertas disparados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            // Implementar limpeza de histórico
            await loadData();
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Estatísticas */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeAlerts || 0}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.triggeredAlerts || 0}</Text>
            <Text style={styles.statLabel}>Disparados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.historyCount || 0}</Text>
            <Text style={styles.statLabel}>Histórico</Text>
          </View>
        </View>
      </View>

      {/* Alertas Ativos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Alertas Ativos</Text>
        {activeAlerts.length > 0 ? (
          activeAlerts.map((alert, index) => (
            <View key={index} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                <TouchableOpacity onPress={() => handleDeleteAlert(alert.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.alertDetails}>
                {alert.type === 'above' ? '📈' : '📉'} 
                {alert.type === 'above' ? ' Acima de' : ' Abaixo de'} R$ {alert.targetPrice.toFixed(2)}
              </Text>
              <Text style={styles.alertDate}>
                Criado: {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum alerta ativo</Text>
        )}
      </View>

      {/* Histórico */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📜 Histórico</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearButton}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>
        {history.length > 0 ? (
          history.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historySymbol}>{item.symbol}</Text>
                <Text style={styles.historyPrice}>
                  R$ {item.triggeredPrice.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.historyDetails}>
                Alvo: R$ {item.targetPrice.toFixed(2)} 
                {item.type === 'above' ? ' 📈' : ' 📉'}
              </Text>
              <Text style={styles.historyDate}>
                {new Date(item.triggeredAt).toLocaleString('pt-BR')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum alerta disparado ainda</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  deleteButton: {
    fontSize: 20,
  },
  alertDetails: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 4,
  },
  alertDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  historyCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  historyDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  emptyText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginVertical: 24,
  },
});

export default AlertsHistoryScreen;