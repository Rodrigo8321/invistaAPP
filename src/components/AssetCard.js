import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
          <Text style={styles.quantity}>{holding.quantity} ações</Text>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.currentPrice}>R$ {(currentPrice || 0).toFixed(2)}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    color: '#2C3E50',
  },
  quantity: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  positive: {
    color: '#27AE60',
  },
  negative: {
    color: '#E74C3C',
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E8ED',
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
    color: '#7F8C8D',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  clickIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F5',
    alignItems: 'center',
  },
  clickText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default AssetCard;