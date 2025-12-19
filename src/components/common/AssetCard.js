import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../styles/colors';

export default function AssetCard({
  asset,
  currentPrice,
  onPress,
}) {
  if (!asset) return null;

  const quantity = asset.quantity ?? 0;
  const averagePrice = asset.averagePrice ?? 0;

  const totalInvested = quantity * averagePrice;
  const totalValue = quantity * (currentPrice ?? 0);
  const profit = totalValue - totalInvested;
  const profitPercent =
    totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      testID="asset-card"
    >
      <View style={styles.header}>
        <Text style={styles.ticker}>{asset.ticker}</Text>
        <Text style={styles.quantity}>
          {quantity} un.
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Preço médio</Text>
        <Text style={styles.value}>
          R$ {averagePrice.toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Preço atual</Text>
        <Text style={styles.value}>
          R$ {(currentPrice ?? 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Resultado</Text>
        <Text
          style={[
            styles.value,
            profit >= 0 ? styles.profit : styles.loss,
          ]}
        >
          R$ {profit.toFixed(2)} ({profitPercent.toFixed(2)}%)
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticker: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  quantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  profit: {
    color: colors.success,
  },
  loss: {
    color: colors.danger,
  },
});
