import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import colors from '../../styles/colors';
import { exchangeRateService } from '../../services/exchangeRateService';

const { width } = Dimensions.get('window');

const DiversificationChart = ({ portfolio }) => {
  const [exchangeRate, setExchangeRate] = useState(5.0);

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    const rate = await exchangeRateService.getUSDtoBRL();
    setExchangeRate(rate);
  };

  const data = useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return [];
    }

    const byType = portfolio.reduce((acc, asset) => {
      // Converter para BRL se necessário
      const value = asset.quantity * (asset.currency === 'USD' 
        ? asset.currentPrice * exchangeRate 
        : asset.currentPrice);
      
      const existing = acc.find(a => a.name === asset.type);
      if (existing) {
        existing.value += value;
        existing.count += 1;
      } else {
        acc.push({ 
          name: asset.type, 
          value, 
          count: 1,
          country: asset.country,
        });
      }
      return acc;
    }, []);

    const total = byType.reduce((sum, item) => sum + item.value, 0);

    return byType
      .map(item => ({
        ...item,
        percent: total > 0 && typeof item.value === 'number' && !isNaN(item.value) ? ((item.value / total) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio, exchangeRate]);

  // Cores por tipo
  const COLORS = {
    'Ação': colors.primary,
    'FII': colors.secondary,
    'Stock': colors.info,
    'REIT': colors.success,
    'ETF': colors.warning,
    'Crypto': colors.danger,
  };

  // Ícones por tipo
  const ICONS = {
    'Ação': '📈',
    'FII': '🏢',
    'Stock': '🇺🇸',
    'REIT': '🏘️',
    'ETF': '📦',
    'Crypto': '💰',
  };

  const getAnalysisMessage = () => {
    if (data.length === 0) return 'Sem dados';
    
    const maxPercent = Math.max(...data.map(d => parseFloat(d.percent)));
    const diverseCount = data.filter(d => parseFloat(d.percent) > 10).length;
    
    if (maxPercent > 70) {
      return `⚠️ Portfolio muito concentrado em ${data[0]?.name} (${data[0]?.percent}%). Considere diversificar.`;
    }
    
    if (diverseCount >= 4) {
      return `⭐ Portfolio bem diversificado entre ${data.length} tipo(s) de ativo. Excelente!`;
    }
    
    return `✓ Portfolio diversificado entre ${data.length} tipo(s) de ativo.`;
  };

  if (!portfolio || portfolio.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎯 Diversificação do Portfolio</Text>
        <Text style={styles.emptyText}>Nenhum ativo no portfolio</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Diversificação do Portfolio</Text>

      <View style={styles.chartContainer}>
        {/* Gráfico de barras horizontais */}
        <View style={styles.barsContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.barSegment}>
              <View style={styles.barHeader}>
                <View style={styles.barLabelContainer}>
                  <Text style={styles.barIcon}>{ICONS[item.name]}</Text>
                  <Text style={styles.barLabel}>{item.name}</Text>
                </View>
                <Text style={styles.barPercent}>{item.percent}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: COLORS[item.name] || colors.primary,
                      width: `${item.percent}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Legenda Detalhada */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.dot, { backgroundColor: COLORS[item.name] || colors.primary }]}
            />
            <View style={styles.legendContent}>
              <View style={styles.legendHeader}>
                <Text style={styles.legendIcon}>{ICONS[item.name]}</Text>
                <Text style={styles.legendLabel}>{item.name}</Text>
              </View>
              <Text style={styles.legendValue}>
                {item.percent}% • {item.count} ativo{item.count > 1 ? 's' : ''}
              </Text>
              <Text style={styles.legendCountry}>
                {item.country === 'BR' ? '🇧🇷 Brasil' : 
                 item.country === 'US' ? '🇺🇸 EUA' : 
                 '🌐 Global'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Análise */}
      <View style={styles.analysis}>
        <Text style={styles.analysisText}>
          {getAnalysisMessage()}
        </Text>
      </View>

      {/* Stats Rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Tipos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {data.reduce((sum, item) => sum + item.count, 0)}
          </Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {data.filter(d => parseFloat(d.percent) > 15).length}
          </Text>
          <Text style={styles.statLabel}>Principais</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  barsContainer: {
    gap: 16,
  },
  barSegment: {
    marginBottom: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  barLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  barPercent: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  barTrack: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  legend: {
    marginBottom: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  legendContent: {
    flex: 1,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  legendLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  legendValue: {
    color: colors.text,
    fontSize: 12,
    marginBottom: 2,
  },
  legendCountry: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  analysis: {
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  analysisText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});

export default DiversificationChart;
