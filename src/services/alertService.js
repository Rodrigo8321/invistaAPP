import AsyncStorage from '@react-native-async-storage/async-storage';

const ALERTS_KEY = 'price_alerts';

// ========== TIPOS DE ALERTA ==========
export const ALERT_TYPES = {
  PRICE_ABOVE: 'price_above',      // Preço subiu acima de X
  PRICE_BELOW: 'price_below',      // Preço caiu abaixo de X
  CHANGE_UP: 'change_up',          // Variação subiu +X%
  CHANGE_DOWN: 'change_down',      // Variação caiu -X%
};

// ========== ESTRUTURA DE ALERTA ==========
/**
 * Alert = {
 *   id: string (timestamp),
 *   ticker: string,
 *   assetName: string,
 *   type: ALERT_TYPES,
 *   targetValue: number,
 *   currentValue: number,
 *   triggered: boolean,
 *   createdAt: timestamp,
 *   triggeredAt: timestamp | null,
 * }
 */

// ========== CARREGAR ALERTAS ==========
export const loadAlerts = async () => {
  try {
    const alertsJson = await AsyncStorage.getItem(ALERTS_KEY);
    if (!alertsJson) return [];
    
    const alerts = JSON.parse(alertsJson);
    console.log(`✅ Alertas carregados: ${alerts.length}`);
    return alerts;
  } catch (error) {
    console.error('❌ Erro ao carregar alertas:', error);
    return [];
  }
};

// ========== SALVAR ALERTAS ==========
export const saveAlerts = async (alerts) => {
  try {
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    console.log(`✅ Alertas salvos: ${alerts.length}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar alertas:', error);
    return false;
  }
};

// ========== CRIAR NOVO ALERTA ==========
export const createAlert = async (ticker, assetName, type, targetValue, currentValue) => {
  try {
    const alerts = await loadAlerts();
    
    const newAlert = {
      id: Date.now().toString(),
      ticker,
      assetName,
      type,
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue),
      triggered: false,
      createdAt: Date.now(),
      triggeredAt: null,
    };
    
    alerts.push(newAlert);
    await saveAlerts(alerts);
    
    console.log(`✅ Alerta criado: ${ticker} - ${type} - ${targetValue}`);
    return newAlert;
  } catch (error) {
    console.error('❌ Erro ao criar alerta:', error);
    return null;
  }
};

// ========== DELETAR ALERTA ==========
export const deleteAlert = async (alertId) => {
  try {
    const alerts = await loadAlerts();
    const filtered = alerts.filter(a => a.id !== alertId);
    await saveAlerts(filtered);
    
    console.log(`✅ Alerta deletado: ${alertId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar alerta:', error);
    return false;
  }
};

// ========== VERIFICAR ALERTAS ==========
export const checkAlerts = async (assets, realPrices, exchangeRate) => {
  try {
    const alerts = await loadAlerts();
    const activeAlerts = alerts.filter(a => !a.triggered);
    
    if (activeAlerts.length === 0) {
      return [];
    }
    
    const triggeredAlerts = [];
    
    activeAlerts.forEach(alert => {
      const asset = assets.find(a => a.ticker === alert.ticker);
      if (!asset) return;
      
      const realPrice = realPrices[alert.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;
      const priceInBRL = asset.currency === 'USD' ? currentPrice * exchangeRate : currentPrice;
      
      let shouldTrigger = false;
      
      switch (alert.type) {
        case ALERT_TYPES.PRICE_ABOVE:
          shouldTrigger = priceInBRL >= alert.targetValue;
          break;
        case ALERT_TYPES.PRICE_BELOW:
          shouldTrigger = priceInBRL <= alert.targetValue;
          break;
        case ALERT_TYPES.CHANGE_UP:
          const changeUp = realPrice?.changePercent || 0;
          shouldTrigger = changeUp >= alert.targetValue;
          break;
        case ALERT_TYPES.CHANGE_DOWN:
          const changeDown = realPrice?.changePercent || 0;
          shouldTrigger = changeDown <= -alert.targetValue;
          break;
      }
      
      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = Date.now();
        alert.currentValue = priceInBRL;
        triggeredAlerts.push(alert);
      }
    });
    
    if (triggeredAlerts.length > 0) {
      await saveAlerts(alerts);
      console.log(`🔔 ${triggeredAlerts.length} alertas disparados!`);
    }
    
    return triggeredAlerts;
  } catch (error) {
    console.error('❌ Erro ao verificar alertas:', error);
    return [];
  }
};

// ========== MARCAR ALERTA COMO LIDO ==========
export const markAlertAsRead = async (alertId) => {
  try {
    const alerts = await loadAlerts();
    const alert = alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.read = true;
      await saveAlerts(alerts);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao marcar alerta como lido:', error);
    return false;
  }
};

// ========== LIMPAR ALERTAS DISPARADOS ==========
export const clearTriggeredAlerts = async () => {
  try {
    const alerts = await loadAlerts();
    const active = alerts.filter(a => !a.triggered);
    await saveAlerts(active);
    
    console.log(`🗑️ Alertas disparados limpos`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar alertas:', error);
    return false;
  }
};

// ========== FORMATAR DESCRIÇÃO DO ALERTA ==========
export const getAlertDescription = (alert) => {
  if (!alert) return 'Alerta inválido';

  const { type, targetValue, ticker } = alert;
  const hasNumericTarget = typeof targetValue === 'number';

  switch (type) {
    case ALERT_TYPES.PRICE_ABOVE:
      return `${ticker} atingir R$ ${hasNumericTarget ? targetValue.toFixed(2) : '...'}`;
    case ALERT_TYPES.PRICE_BELOW:
      return `${ticker} cair para R$ ${hasNumericTarget ? targetValue.toFixed(2) : '...'}`;
    case ALERT_TYPES.CHANGE_UP:
      return `${ticker} subir +${hasNumericTarget ? targetValue.toFixed(1) : '...'}%`;
    case ALERT_TYPES.CHANGE_DOWN:
      return `${ticker} cair -${hasNumericTarget ? targetValue.toFixed(1) : '...'}%`;
    default:
      return ticker;
  }
};

// ========== OBTER ÍCONE DO ALERTA ==========
export const getAlertIcon = (type) => {
  switch (type) {
    case ALERT_TYPES.PRICE_ABOVE:
      return '📈';
    case ALERT_TYPES.PRICE_BELOW:
      return '📉';
    case ALERT_TYPES.CHANGE_UP:
      return '🚀';
    case ALERT_TYPES.CHANGE_DOWN:
      return '⚠️';
    default:
      return '🔔';
  }
};
