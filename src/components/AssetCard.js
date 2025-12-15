import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';

const AssetCard = ({ holding, currentPrice }) => {
  const navigation = useNavigation();
  
  const totalValue = (holding.quantity || 0) * (currentPrice || 0); // Valor atual do ativo
  const totalCost = (holding.quantity || 0) * (holding.averagePrice || 0); // Custo total de aquisição
  const profit = totalValue - totalCost;
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  
  const isPositive = profit >= 0;

  // Navega para a tela de detalhes ao clicar no card
  const handlePress = () => {
    navigation.navigate('AssetDetails', {
      symbol: holding.ticker,
      holding: holding
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{holding.symbol}</Text>
          <Text style={styles.name}>{holding.name}</Text>
          <Text style={styles.quantity}>{holding.quantity} ações</Text>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.currentPrice}>R$ {(totalValue || 0).toFixed(2)}</Text>
          <Text style={[
            styles.change,
            isPositive ? styles.positive : styles.negative
          ]}>
            {isPositive ? '+' : ''}{(profitPercent || 0).toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Preço Médio</Text>
          <Text style={styles.footerValue}>R$ {(holding.averagePrice || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Valor Atual</Text>
          <Text style={styles.footerValue}>R$ {(totalValue || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Lucro/Prejuízo</Text>
          <Text style={[
            styles.footerValue,
            isPositive ? styles.positive : styles.negative
          ]}>
            R$ {(profit || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Indicador visual de que é clicável */}
      <View style={styles.clickIndicator}>
        <Text style={styles.clickText}>Toque para ver análise →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  quantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clickIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  clickText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AssetCard;