import AsyncStorage from '@react-native-async-storage/async-storage';

const ALERTS_KEY_PREFIX = '@InvestPro:Alerts_';

// Mock Alert Service
const AlertService = {
  async loadAlerts() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const alertKeys = keys.filter(key => key.startsWith(ALERTS_KEY_PREFIX));
      const alerts = await AsyncStorage.multiGet(alertKeys);
      return alerts.flatMap(item => JSON.parse(item[1]));
    } catch (error) {
      console.error('Erro ao carregar todos os alertas:', error);
      return [];
    }
  },
  async getAlerts(symbol) {
    try {
      const key = `${ALERTS_KEY_PREFIX}${symbol}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }
  },

  async createAlert(alert) {
    try {
      const key = `${ALERTS_KEY_PREFIX}${alert.symbol}`;
      const alerts = await this.getAlerts(alert.symbol);
      
      const newAlert = { ...alert, id: Date.now().toString() };
      alerts.push(newAlert);
      
      await AsyncStorage.setItem(key, JSON.stringify(alerts));
      return newAlert;
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      return null;
    }
  },

  async deleteAlert(alertId, symbol) {
    try {
      const key = `${ALERTS_KEY_PREFIX}${symbol}`;
      let alerts = await this.getAlerts(symbol);
      alerts = alerts.filter(a => a.id !== alertId);
      await AsyncStorage.setItem(key, JSON.stringify(alerts));
      return true;
    } catch (error) {
      console.error('Erro ao deletar alerta:', error);
      return false;
    }
  },

  startPriceChecking() {
    console.log('🔔 Serviço de verificação de preços iniciado (mock).');
    // Em um app real, aqui você iniciaria um background task
    // para verificar os preços periodicamente.
  },

  async getHistory() {
    // Mock de histórico
    return [
      { id: '1', symbol: 'PETR4', triggeredPrice: 40.50, targetPrice: 40.00, type: 'above', triggeredAt: new Date().toISOString() },
      { id: '2', symbol: 'VALE3', triggeredPrice: 60.00, targetPrice: 61.00, type: 'below', triggeredAt: new Date(Date.now() - 86400000).toISOString() },
    ];
  },

  async getStats() {
    const allAlerts = await this.loadAlerts();
    const history = await this.getHistory();
    
    const activeAlerts = allAlerts.filter(a => !a.triggered).length;
    const triggeredAlerts = allAlerts.filter(a => a.triggered).length;

    return {
      activeAlerts: activeAlerts,
      triggeredAlerts: triggeredAlerts,
      historyCount: history.length,
    };
  },
};

export default AlertService;