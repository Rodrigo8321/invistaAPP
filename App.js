// App.js - VERSÃO COMPLETA COM TODAS AS FEATURES
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';

// Importe os Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { PortfolioProvider } from './src/contexts/PortfolioContext';

// Importe suas telas
import PortfolioScreen from './src/screens/main/PortfolioScreen';
import AssetDetailsScreen from './src/screens/main/AssetDetailsScreen';
import TransactionsScreen from './src/screens/main/TransactionHistoryScreen';
import AlertsHistoryScreen from './src/screens/main/AlertsHistoryScreen';

// Importe serviços
import AlertService from './src/services/alertService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de Portfolio (Portfolio + Detalhes do Ativo)
const PortfolioStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen 
        name="PortfolioHome" 
        component={PortfolioScreen}
      />
      <Stack.Screen 
        name="AssetDetails" 
        component={AssetDetailsScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#4A90E2',
        }}
      />
    </Stack.Navigator>
  );
};

// Stack de Alertas
const AlertsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AlertsHistory" 
        component={AlertsHistoryScreen}
        options={{
          title: 'Meus Alertas',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
};

// Navegação principal com tabs
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E1E8ED',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Portfolio" 
        component={PortfolioStack}
        options={{
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 24 }}>
              {focused ? '📊' : '📈'}
            </Text>
          ),
        }}
      />
      
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transações',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 24 }}>
              {focused ? '💰' : '💸'}
            </Text>
          ),
        }}
      />

      <Tab.Screen 
        name="Alerts" 
        component={AlertsStack}
        options={{
          tabBarLabel: 'Alertas',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 24 }}>
              {focused ? '🔔' : '🔕'}
            </Text>
          ),
          tabBarBadge: null, // Pode adicionar contador de alertas ativos
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  useEffect(() => {
    // Inicializa o serviço de alertas ao abrir o app
    initializeAlertService();
  }, []);

  const initializeAlertService = async () => {
    try {
      // Carrega alertas salvos
      await AlertService.loadAlerts();
      
      // Inicia verificação automática se houver alertas ativos
      const alerts = await AlertService.getAlerts();
      if (alerts.length > 0) {
        AlertService.startPriceChecking();
        console.log(`🔔 Alert service started with ${alerts.length} active alerts`);
      }
    } catch (error) {
      console.error('Error initializing alert service:', error);
    }
  };

  return (
    <AuthProvider>
      <PortfolioProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </PortfolioProvider>
    </AuthProvider>
  );
}