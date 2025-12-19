import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import BrapiService from '../../services/brapiService';
import NewsService from '../../services/NewsService';
import AlertService from '../../services/alertService';
import colors from '../../styles/colors';

const { width } = Dimensions.get('window');

const AssetDetailsScreen = ({ route, navigation }) => {
  // ✅ CORREÇÃO: Extrai os parâmetros de forma flexível.
  const asset = route.params.asset || {};
  const symbol = route.params.symbol || asset.ticker;
  const holding = route.params.holding || asset;
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assetData, setAssetData] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Controles de UI
  const [activeTab, setActiveTab] = useState('overview'); // overview, chart, news, competitors
  const [chartPeriod, setChartPeriod] = useState('1M'); // 1M, 3M, 6M, 1Y
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above'); // above, below

  // Função segura para formatar números, evitando 'NaN'
  const safeToFixed = (value, decimals = 2) => {
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  useEffect(() => {
    loadAllData();
    loadAlerts();
  }, [symbol]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        loadAssetData(),
        loadPriceHistory(chartPeriod),
        loadNews(),
        loadCompetitors()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssetData = async () => {
    const [quoteData, fundData] = await Promise.all([
      BrapiService.getQuote(symbol),
      BrapiService.getFundamentals(symbol)
    ]);
    setAssetData(quoteData);
    setFundamentals(fundData);
  };

  const loadPriceHistory = async (period) => {
    try {
      const history = await BrapiService.getPriceHistory(symbol, period);
      setPriceHistory(history);
    } catch (error) {
      console.error(`Falha ao carregar histórico de preços para ${symbol}:`, error);
      setPriceHistory([]); // Define como vazio para evitar que a tela quebre
    }
  };

  const loadNews = async () => {
    const newsData = await NewsService.getAssetNews(symbol);
    setNews(newsData);
  };

  const loadCompetitors = async () => {
    const competitorData = await BrapiService.getCompetitors(symbol);
    setCompetitors(competitorData);
  };

  const loadAlerts = async () => {
    const userAlerts = await AlertService.getAlerts(symbol);
    setAlerts(userAlerts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleCreateAlert = async () => {
    if (!alertPrice || isNaN(parseFloat(alertPrice))) {
      Alert.alert('Erro', 'Digite um preço válido');
      return;
    }

    const alert = {
      symbol,
      targetPrice: parseFloat(alertPrice),
      type: alertType,
      currentPrice: assetData.price,
      createdAt: new Date().toISOString()
    };

    await AlertService.createAlert(alert);
    await loadAlerts();
    setShowAlertModal(false);
    setAlertPrice('');
    
    Alert.alert(
      'Alerta Criado!',
      `Você será notificado quando ${symbol} ${alertType === 'above' ? 'ultrapassar' : 'cair abaixo de'} R$ ${alertPrice}`
    );
  };

  const handleDeleteAlert = async (alertId) => {
    Alert.alert(
      'Excluir Alerta',
      'Tem certeza que deseja excluir este alerta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await AlertService.deleteAlert(alertId);
            await loadAlerts();
          }
        }
      ]
    );
  };

  const renderMetricCard = (title, value, subtitle, color = '#4A90E2') => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const getStatusColor = (metric, value) => {
    // Define cores baseadas em boas práticas de análise fundamentalista
    if (metric === 'P/L') {
      if (value < 10) return '#27AE60'; // Barato
      if (value < 20) return '#F39C12'; // Razoável
      return '#E74C3C'; // Caro
    }
    if (metric === 'ROE' || metric === 'Margem Líquida') {
      if (value > 15) return '#27AE60';
      if (value > 5) return '#F39C12';
      return '#E74C3C';
    }
    return '#4A90E2';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando análise completa...</Text>
      </View>
    );
  }

  const renderOverviewTab = () => (
    <>
      {holding && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Sua Posição</Text>
          <View style={styles.row}>
            {renderMetricCard(
              'Quantidade',
              holding.quantity,
              'Ações',
              '#9B59B6'
            )}
            {renderMetricCard(
              'Preço Médio',
              `R$ ${safeToFixed(holding.averagePrice)}`,
              'Compra',
              '#9B59B6'
            )}
          </View>
          <View style={styles.row}>
            {renderMetricCard(
              'Valor Investido',
              `R$ ${safeToFixed(holding.quantity * holding.averagePrice)}`,
              'Total aplicado',
              '#3498DB'
            )}
            {renderMetricCard(
              'Valor Atual',
              `R$ ${safeToFixed(holding.quantity * assetData?.price)}`,
              'Posição atual',
              '#3498DB'
            )}
          </View>
          {renderMetricCard(
            'Resultado',
            `R$ ${safeToFixed((holding.quantity * assetData?.price) - (holding.quantity * holding.averagePrice))}`,
            `${safeToFixed(((assetData?.price / holding.averagePrice) - 1) * 100)}% de rentabilidade`,
            ((assetData?.price / holding.averagePrice) - 1) >= 0 ? colors.success : colors.danger
          )}
        </View>
      )}

      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Alertas Ativos</Text>
          {alerts.map((alert, index) => (
            <View key={index} style={styles.alertCard}>
              <View style={styles.alertContent}>
                <Text style={styles.alertText}>
                  {alert.type === 'above' ? '📈' : '📉'} R$ {alert.targetPrice.toFixed(2)}
                </Text>
                <Text style={styles.alertSubtext}>
                  {alert.type === 'above' ? 'Subir acima de' : 'Cair abaixo de'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteAlertButton}
                onPress={() => handleDeleteAlert(alert.id)}
              >
                <Text style={styles.deleteAlertText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Valuation (Preço vs Valor)</Text>
        <Text style={styles.sectionDescription}>
          Indicadores que mostram se a ação está cara ou barata
        </Text>
        
        <View style={styles.row}>
          {renderMetricCard(
            'P/L (Price/Earnings)',
            safeToFixed(fundamentals?.priceEarnings),
            'Quanto o mercado paga por R$ 1 de lucro',
            getStatusColor('P/L', fundamentals?.priceEarnings)
          )}
          {renderMetricCard(
            'P/VP (Price/Book)',
            safeToFixed(fundamentals?.priceToBook),
            'Preço em relação ao patrimônio',
            getStatusColor('P/L', fundamentals?.priceToBook)
          )}
        </View>
        
        <View style={styles.row}>
          {renderMetricCard(
            'EV/EBITDA',
            safeToFixed(fundamentals?.evToEbitda),
            'Valor da empresa vs geração de caixa',
            '#E67E22'
          )}
          {renderMetricCard(
            'PSR (Price/Sales)',
            safeToFixed(fundamentals?.priceToSales),
            'Preço em relação à receita',
            '#E67E22'
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Rentabilidade e Eficiência</Text>
        <Text style={styles.sectionDescription}>
          O quão eficiente a empresa é em gerar lucro
        </Text>
        
        <View style={styles.row}>
          {renderMetricCard(
            'ROE (Return on Equity)',
            `${safeToFixed(fundamentals?.roe)}%`,
            'Retorno sobre patrimônio líquido',
            getStatusColor('ROE', fundamentals?.roe)
          )}
          {renderMetricCard(
            'ROA (Return on Assets)',
            `${safeToFixed(fundamentals?.roa)}%`,
            'Retorno sobre ativos',
            getStatusColor('ROE', fundamentals?.roa)
          )}
        </View>
        
        <View style={styles.row}>
          {renderMetricCard(
            'Margem Líquida',
            `${safeToFixed(fundamentals?.netMargin)}%`,
            'Lucro líquido / Receita',
            getStatusColor('Margem Líquida', fundamentals?.netMargin)
          )}
          {renderMetricCard(
            'Margem EBITDA',
            `${safeToFixed(fundamentals?.ebitdaMargin)}%`,
            'EBITDA / Receita',
            '#16A085'
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Endividamento</Text>
        <Text style={styles.sectionDescription}>
          Saúde financeira e capacidade de pagamento
        </Text>
        
        <View style={styles.row}>
          {renderMetricCard(
            'Dívida Líquida/EBITDA',
            safeToFixed(fundamentals?.netDebtToEbitda),
            'Quantos anos para pagar a dívida',
            fundamentals?.netDebtToEbitda < 2 ? '#27AE60' : '#E74C3C'
          )}
          {renderMetricCard(
            'Dívida/Patrimônio',
            `${safeToFixed(fundamentals?.debtToEquity)}%`,
            'Alavancagem da empresa',
            '#8E44AD'
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💵 Dividendos</Text>
        <Text style={styles.sectionDescription}>
          Proventos distribuídos aos acionistas
        </Text>
        
        <View style={styles.row}>
          {renderMetricCard(
            'Dividend Yield',
            `${safeToFixed(fundamentals?.dividendYield)}%`,
            'Rendimento anual em dividendos',
            '#27AE60'
          )}
          {renderMetricCard(
            'Payout Ratio',
            `${safeToFixed(fundamentals?.payoutRatio)}%`,
            '% do lucro distribuído',
            '#27AE60'
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💼 Resultados (Últimos 12 Meses)</Text>
        
        {renderMetricCard(
          'Receita Líquida',
          `R$ ${safeToFixed(fundamentals?.revenue / 1000000000)} bi`,
          'Faturamento da empresa',
          '#3498DB'
        )}
        
        {renderMetricCard(
          'EBITDA',
          `R$ ${safeToFixed(fundamentals?.ebitda / 1000000000)} bi`,
          'Lucro operacional (antes de juros e impostos)',
          '#2ECC71'
        )}
        
        {renderMetricCard(
          'Lucro Líquido',
          `R$ ${safeToFixed(fundamentals?.netIncome / 1000000000)} bi`,
          'Resultado final da empresa',
          '#27AE60'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Informações de Mercado</Text>
        
        <View style={styles.row}>
          {renderMetricCard(
            'Market Cap',
            `R$ ${safeToFixed(assetData?.marketCap / 1000000000)} bi`,
            'Valor de mercado',
            '#E74C3C'
          )}
          {renderMetricCard(
            'Volume',
            `${safeToFixed(assetData?.volume / 1000000)}M`,
            'Volume médio negociado',
            '#95A5A6'
          )}
        </View>
        
        <View style={styles.row}>
          {renderMetricCard(
            'Máxima 52 Semanas',
            `R$ ${safeToFixed(fundamentals?.high52Week)}`,
            'Maior cotação do ano',
            '#16A085'
          )}
          {renderMetricCard(
            'Mínima 52 Semanas',
            `R$ ${safeToFixed(fundamentals?.low52Week)}`,
            'Menor cotação do ano',
            '#C0392B'
          )}
        </View>
      </View>

      <View style={[styles.section, styles.analysisSection]}>
        <Text style={styles.sectionTitle}>🎯 Análise Rápida</Text>
        <View style={styles.analysisList}>
          <Text style={styles.analysisItem}>
            {fundamentals?.priceEarnings < 15 ? '✅' : '⚠️'} 
            {' '}P/L {fundamentals?.priceEarnings < 15 ? 'atrativo' : 'elevado'} 
            ({safeToFixed(fundamentals?.priceEarnings)})
          </Text>
          <Text style={styles.analysisItem}>
            {fundamentals?.roe > 10 ? '✅' : '⚠️'} 
            {' '}ROE {fundamentals?.roe > 10 ? 'bom' : 'baixo'} 
            ({safeToFixed(fundamentals?.roe)}%)
          </Text>
          <Text style={styles.analysisItem}>
            {fundamentals?.netDebtToEbitda < 3 ? '✅' : '⚠️'} 
            {' '}Dívida {fundamentals?.netDebtToEbitda < 3 ? 'controlada' : 'elevada'} 
            ({safeToFixed(fundamentals?.netDebtToEbitda)}x EBITDA)
          </Text>
          <Text style={styles.analysisItem}>
            {fundamentals?.dividendYield > 4 ? '✅' : '⚠️'} 
            {' '}Dividend Yield {fundamentals?.dividendYield > 4 ? 'atrativo' : 'moderado'} 
            ({safeToFixed(fundamentals?.dividendYield)}%)
          </Text>
        </View>
        
        <Text style={styles.disclaimer}>
          ⚠️ Esta análise é apenas informativa e não constitui recomendação de investimento.
        </Text>
      </View>
    </>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.companyName}>{assetData?.name || 'Carregando...'}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>
            R$ {assetData?.price?.toFixed(2)}
          </Text>
          <Text style={[
            styles.priceChange,
            assetData?.changePercent >= 0 ? styles.positive : styles.negative
          ]}>
            {assetData?.changePercent >= 0 ? '+' : ''}
            {assetData?.changePercent?.toFixed(2)}% hoje
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.alertButton}
          onPress={() => setShowAlertModal(true)}
        >
          <Text style={styles.alertButtonText}>🔔 Criar Alerta de Preço</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          📊 Visão Geral
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, activeTab === 'chart' && styles.activeTab]}
        onPress={() => setActiveTab('chart')}
      >
        <Text style={[styles.tabText, activeTab === 'chart' && styles.activeTabText]}>
          📈 Gráfico
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, activeTab === 'news' && styles.activeTab]}
        onPress={() => setActiveTab('news')}
      >
        <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
          📰 Notícias
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, activeTab === 'competitors' && styles.activeTab]}
        onPress={() => setActiveTab('competitors')}
      >
        <Text style={[styles.tabText, activeTab === 'competitors' && styles.activeTabText]}>
          🎯 Comparar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChartTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📈 Histórico de Preços</Text>
      
      {/* Seletor de Período */}
      <View style={styles.periodSelector}>
        {['1M', '3M', '6M', '1Y', '5Y'].map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              chartPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => {
              setChartPeriod(period);
              loadPriceHistory(period);
            }}
          >
            <Text style={[
              styles.periodButtonText,
              chartPeriod === period && styles.periodButtonTextActive
            ]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gráfico */}
      {priceHistory.length > 0 ? (
        <LineChart
          data={{
            labels: priceHistory.map((_, i) => 
              i % Math.floor(priceHistory.length / 5) === 0 ? 
              new Date(priceHistory[i].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''
            ),
            datasets: [{
              data: priceHistory.map(item => item.price),
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              strokeWidth: 2
            }]
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '3',
              strokeWidth: '2',
              stroke: '#4A90E2'
            }
          }}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={styles.noDataText}>Carregando histórico...</Text>
      )}

      {/* Estatísticas do Período */}
      <View style={styles.chartStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máxima</Text>
          <Text style={styles.statValue}>
            R$ {Math.max(...priceHistory.map(h => h.price)).toFixed(2)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mínima</Text>
          <Text style={styles.statValue}>
            R$ {Math.min(...priceHistory.map(h => h.price)).toFixed(2)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Variação</Text>
          <Text style={[
            styles.statValue,
            priceHistory.length > 0 && 
            ((priceHistory[priceHistory.length - 1].price / priceHistory[0].price - 1) >= 0 
              ? styles.positive : styles.negative)
          ]}>
            {priceHistory.length > 0 ? 
              ((priceHistory[priceHistory.length - 1].price / priceHistory[0].price - 1) * 100).toFixed(2) 
              : '0.00'}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderNewsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📰 Notícias Recentes</Text>
      <Text style={styles.sectionDescription}>
        Últimas notícias relacionadas a {symbol}
      </Text>

      {news.length > 0 ? (
        news.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.newsCard}
            onPress={() => {
              // Abrir notícia no navegador ou WebView
              console.log('Open news:', item.url);
            }}
          >
            <View style={styles.newsHeader}>
              <Text style={styles.newsSource}>{item.source}</Text>
              <Text style={styles.newsDate}>
                {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.newsDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.readMore}>Ler mais →</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noDataText}>Nenhuma notícia recente encontrada</Text>
      )}
    </View>
  );

  const renderAlertModal = () => (
    <Modal
      visible={showAlertModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAlertModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Criar Alerta de Preço</Text>
          <Text style={styles.modalSubtitle}>
            Preço atual: R$ {assetData?.price?.toFixed(2)}
          </Text>

          <View style={styles.alertTypeSelector}>
            <TouchableOpacity
              style={[
                styles.alertTypeButton,
                alertType === 'above' && styles.alertTypeButtonActive
              ]}
              onPress={() => setAlertType('above')}
            >
              <Text style={[
                styles.alertTypeText,
                alertType === 'above' && styles.alertTypeTextActive
              ]}>
                📈 Acima de
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.alertTypeButton,
                alertType === 'below' && styles.alertTypeButtonActive
              ]}
              onPress={() => setAlertType('below')}
            >
              <Text style={[
                styles.alertTypeText,
                alertType === 'below' && styles.alertTypeTextActive
              ]}>
                📉 Abaixo de
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.priceInput}
            placeholder="Digite o preço alvo"
            keyboardType="decimal-pad"
            value={alertPrice}
            onChangeText={setAlertPrice}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleCreateAlert}
            >
              <Text style={styles.confirmButtonText}>Criar Alerta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderTabs()}
      
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'chart' && renderChartTab()}
      {activeTab === 'news' && renderNewsTab()}
      {activeTab === 'competitors' && renderCompetitorsTab()}
      
      {renderAlertModal()}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  symbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  companyName: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 4,
  },
  priceContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  priceChange: {
    fontSize: 18,
    marginTop: 4,
    fontWeight: '600',
  },
  positive: {
    color: '#27AE60',
  },
  negative: {
    color: '#E74C3C',
  },
  alertButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4A90E2',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#95A5A6',
    lineHeight: 16,
  },
  // Chart styles
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  periodButtonActive: {
    backgroundColor: '#4A90E2',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  // News styles
  newsCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  newsDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  readMore: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 8,
    fontWeight: '600',
  },
  // Comparison styles
  comparisonTable: {
    marginTop: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    paddingVertical: 12,
  },
  tableHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    width: 100,
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#7F8C8D',
    width: 100,
    textAlign: 'center',
  },
  tableFirstColumn: {
    width: 120,
    textAlign: 'left',
  },
  highlightCell: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  comparisonAnalysis: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  analysisItem: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 20,
  },
  // Alert styles
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  alertSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  deleteAlertButton: {
    padding: 8,
  },
  deleteAlertText: {
    fontSize: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width - 48,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 24,
  },
  alertTypeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  alertTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  alertTypeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  alertTypeText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  alertTypeTextActive: {
    color: '#FFFFFF',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginVertical: 24,
  },
});

export default AssetDetailsScreen;