import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import colors from '../../styles/colors';

const { width } = Dimensions.get('window');

/**
 * Componente que exibe um gráfico de evolução de preço
 * Versão simplificada sem Recharts (que não funciona bem em React Native)
 * @param {object} asset - Dados do ativo
 * @param {number} period - Período em dias (7, 30, 90, 365)
 */
const PriceChart = ({ asset, period = 30 }) => {
  // Gerar dados mock de preço histórico
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();

    // Validar se os preços são números válidos
    const avgPrice = typeof asset.avgPrice === 'number' && !isNaN(asset.avgPrice) ? asset.avgPrice : 0;
    const currentPrice = typeof asset.currentPrice === 'number' && !isNaN(asset.currentPrice) ? asset.currentPrice : avgPrice;

    for (let i = period; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simula variação de preço com padrão realista
      const variation = (Math.random() - 0.5) * 4;
      const price = avgPrice + (currentPrice - avgPrice) * (i / period) + variation;

      data.push({
        day: `${date.getDate()}/${date.getMonth() + 1}`,
        price: parseFloat(price.toFixed(2)),
        fullDate: date.toISOString().split('T')[0],
      });
    }

    return data;
  }, [asset, period]);

  // Calcular min, max e variação
  const stats = useMemo(() => {
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const firstPrice = chartData[0]?.price || 0;
    const currentPrice = typeof asset.currentPrice === 'number' && !isNaN(asset.currentPrice) ? asset.currentPrice : firstPrice;
    const variation = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    return {
      min: typeof min === 'number' && !isNaN(min) ? min : 0,
      max: typeof max === 'number' && !isNaN(max) ? max : 0,
      variation: typeof variation === 'number' && !isNaN(variation) ? variation : 0
    };
  }, [chartData, asset.currentPrice]);

  // Definir cores baseado no desempenho
  const isPositive = stats.variation >= 0;
  const lineColor = isPositive ? colors.success : colors.danger;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Evolução de Preço</Text>
          <Text style={styles.period}>Últimos {period} dias</Text>
        </View>
        <View style={[styles.badge, { 
          backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20' 
        }]}>
          <Text style={[styles.badgeText, { 
            color: isPositive ? colors.success : colors.danger 
          }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(stats.variation).toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Gráfico Simplificado */}
      <View style={styles.chartContainer}>
        <View style={styles.chartGrid}>
          {/* Linhas de grid horizontais */}
          <View style={[styles.gridLine, { top: '0%' }]} />
          <View style={[styles.gridLine, { top: '25%' }]} />
          <View style={[styles.gridLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { top: '75%' }]} />
          <View style={[styles.gridLine, { top: '100%' }]} />
        </View>

        {/* Barras simplificadas para representar preços */}
        <View style={styles.barsContainer}>
          {chartData.map((item, index) => {
            const minPrice = stats.min;
            const maxPrice = stats.max;
            const priceRange = maxPrice - minPrice || 1;
            const heightPercent = ((item.price - minPrice) / priceRange) * 100;
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${heightPercent}%`,
                      backgroundColor: lineColor + '80',
                    }
                  ]} 
                />
              </View>
            );
          })}
        </View>

        {/* Labels do eixo X */}
        <View style={styles.xAxisLabels}>
          <Text style={styles.axisLabel}>{chartData[0]?.day}</Text>
          <Text style={styles.axisLabel}>
            {chartData[Math.floor(chartData.length / 2)]?.day}
          </Text>
          <Text style={styles.axisLabel}>
            {chartData[chartData.length - 1]?.day}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mínimo</Text>
          <Text style={styles.statValue}>R$ {stats.min.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo</Text>
          <Text style={styles.statValue}>R$ {stats.max.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Atual</Text>
          <Text style={styles.statValue}>
            R$ {(typeof asset.currentPrice === 'number' ? asset.currentPrice : 0).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  period: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartContainer: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    bottom: 32,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border + '40',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 168,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});

export default PriceChart;
