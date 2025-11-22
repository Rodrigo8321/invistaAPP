import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { watchlistService } from '../../services/watchlistService';
import { exchangeRateService } from '../../services/exchangeRateService';
import { formatCurrency } from '../../utils/formatters';

const AssetCard = ({ asset, onPress }) => {
  const navigation = useNavigation();
  const [isFavorited, setIsFavorited] = useState(false);
  const [priceInBRL, setPriceInBRL] = useState(asset.currentPrice);

  useEffect(() => {
    checkIfFavorited();
    convertPriceIfNeeded();
  }, [asset.ticker]);

  const checkIfFavorited = async () => {
    const isFav = await watchlistService.isInWatchlist(asset.ticker);
    setIsFavorited(isFav);
  };

  const convertPriceIfNeeded = async () => {
    if (asset.currency === 'USD') {
      const converted = await exchangeRateService.convertUSDtoBRL(asset.currentPrice);
      setPriceInBRL(converted);
    } else {
      setPriceInBRL(asset.currentPrice);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('AssetDetail', { asset });
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const added = await watchlistService.toggleWatchlist(asset.ticker);
      setIsFavorited(added);
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  };

  // Ícones baseados no tipo e país
  const getAssetIcon = () => {
    const icons = {
      'Ação': '📈',
      'FII': '🏢',
      'Stock': '🇺🇸',
      'REIT': '🏘️',
      'ETF': '📦',
      'Crypto': '💰',
    };
    return icons[asset.type] || '📊';
  };

  // Badge de país
  const getCountryBadge = () => {
    const badges = {
      'BR': '🇧🇷',
      'US': '🇺🇸',
      'Global': '🌐',
    };
    return badges[asset.country] || '';
  };

  // Cálculos
  const profit = (asset.currentPrice - asset.avgPrice) * asset.quantity;
  const profitPercent = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
  const isPositive = profit >= 0;

  // Formatação de preço
  const formatPrice = (price, currency) => {
    if (currency === 'USD') {
      return `$${price.toFixed(2)}`;
    }
    return formatCurrency(price);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {/* Star Button */}
      <TouchableOpacity
        style={styles.starButton}
        onPress={handleToggleFavorite}
      >
        <Text style={styles.starIcon}>
          {isFavorited ? '⭐' : '☆'}
        </Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getAssetIcon()}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{asset.ticker}</Text>
            <Text style={styles.countryBadge}>{getCountryBadge()}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
          <Text style={styles.type}>{asset.type}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Preço Atual</Text>
          {asset.currency === 'USD' ? (
            <View>
              <Text style={styles.price}>
                {formatPrice(asset.currentPrice, 'USD')}
              </Text>
              <Text style={styles.priceConverted}>
                ≈ {formatPrice(priceInBRL, 'BRL')}
              </Text>
            </View>
          ) : (
            <Text style={styles.price}>
              {formatPrice(asset.currentPrice, 'BRL')}
            </Text>
          )}
        </View>

        <View style={[styles.changeBadge, {
          backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20'
        }]}>
          <Text style={[styles.changeText, {
            color: isPositive ? colors.success : colors.danger
          }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  starButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  starIcon: {
    fontSize: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginRight: 30,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  ticker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  countryBadge: {
    fontSize: 14,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  type: {
    color: colors.textSecondary,
    fontSize: 11,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
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
  priceConverted: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AssetCard;
