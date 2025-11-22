import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import {
  loadAlerts,
  deleteAlert,
  clearTriggeredAlerts,
  getAlertDescription,
  getAlertIcon,
  checkAlerts,
} from '../../services/alertService';
import { mockAssets } from '../../data/mockAssets';
import { fetchMultipleQuotes, fetchExchangeRate } from '../../services/marketService';

const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active'); // active, triggered, all
  const [realPrices, setRealPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(5.0);

  // ========== LOAD DATA ==========
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      // Load alerts
      const loadedAlerts = await loadAlerts();
      setAlerts(loadedAlerts);

      // Fetch current prices
      const rate = await fetchExchangeRate();
      setExchangeRate(rate);

      const quotes = await fetchMultipleQuotes(mockAssets);
      const pricesMap = {};

      quotes.forEach((quote, index) => {
        const asset = mockAssets[index];
        if (!quote.error) {
          pricesMap[asset.ticker] = {
            price: quote.price,
            changePercent: quote.changePercent,
          };
        }
      });

      setRealPrices(pricesMap);

      // Check if any alert was triggered
      const triggered = await checkAlerts(mockAssets, pricesMap, rate);

      if (triggered.length > 0) {
        Alert.alert(
          '🔔 Alerts Triggered!',
          `${triggered.length} alert(s) were triggered!`,
          [{ text: 'View', onPress: () => setFilter('triggered') }]
        );

        // Reload updated alerts
        const updatedAlerts = await loadAlerts();
        setAlerts(updatedAlerts);
      }
    } catch (error) {
      console.error('❌ Error loading alerts:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ========== DELETE ALERT ==========
  const handleDeleteAlert = (alertId) => {
    Alert.alert(
      '🗑️ Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAlert(alertId);
            loadData();
          },
        },
      ]
    );
  };

  // ========== CLEAR TRIGGERED ==========
  const handleClearTriggered = () => {
    Alert.alert(
      '🗑️ Clear Alerts',
      'Do you want to remove all triggered alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearTriggeredAlerts();
            loadData();
          },
        },
      ]
    );
  };

  // ========== FILTER ALERTS ==========
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.triggered;
    if (filter === 'triggered') return alert.triggered;
    return true;
  });

  const activeCount = alerts.filter(a => !a.triggered).length;
  const triggeredCount = alerts.filter(a => a.triggered).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor={colors.primary}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>
              {activeCount} assets • {triggeredCount} triggered
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <Text style={styles.addButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* STATISTICS */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔔</Text>
            <Text style={styles.statValue}>{triggeredCount}</Text>
            <Text style={styles.statLabel}>Triggered</Text>
          </View>
        </View>

        {/* FILTERS */}
        <View style={styles.filtersSection}>
          <Text style={styles.filterLabel}>Filter:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
              onPress={() => setFilter('active')}
            >
              <Text style={[styles.filterChipText, filter === 'active' && styles.filterChipTextActive]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'triggered' && styles.filterChipActive]}
              onPress={() => setFilter('triggered')}
            >
              <Text style={[styles.filterChipText, filter === 'triggered' && styles.filterChipTextActive]}>
                Triggered
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* CLEAR TRIGGERED BUTTON */}
        {triggeredCount > 0 && (
          <View style={styles.clearSection}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearTriggered}
            >
              <Text style={styles.clearButtonText}>🗑️ Clear Triggered ({triggeredCount})</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ALERTS LIST */}
        <View style={styles.alertsSection}>
          <Text style={styles.alertsSectionTitle}>
            {filteredAlerts.length} {filteredAlerts.length === 1 ? 'Alert' : 'Alerts'}
          </Text>

          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>
                {filter === 'triggered' ? '🔔' : '📊'}
              </Text>
              <Text style={styles.emptyStateText}>
                {filter === 'triggered' ? 'No triggered alerts' : 'No alerts yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {filter === 'triggered' ? 'Triggered alerts will appear here' : 'Create your first alert from the portfolio'}
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertCardLeft}>
                  <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertTicker}>{alert.ticker}</Text>
                    <Text style={styles.alertDescription}>
                      {getAlertDescription(alert)}
                    </Text>
                    <Text style={styles.alertDate}>
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                    </Text>
                    {alert.triggered && (
                      <Text style={styles.alertTriggered}>
                        Triggered: {new Date(alert.triggeredAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAlert(alert.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // STATISTICS
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },

  // FILTERS
  filtersSection: {
    marginBottom: 16,
    paddingLeft: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  // CLEAR SECTION
  clearSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: colors.danger + '20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  clearButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },

  // ALERTS LIST
  alertsSection: {
    paddingHorizontal: 20,
  },
  alertsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ALERT CARD
  alertCard: {
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
  alertCardLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTicker: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  alertDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  alertTriggered: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
});

export default AlertsScreen;
