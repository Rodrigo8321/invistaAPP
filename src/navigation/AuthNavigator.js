import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { authService } from '../services/authService';
import LoginScreen from '../screens/auth/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import { AppNavigator } from './AppNavigator';

// Cria uma instância do navegador de pilha nativo.
const Stack = createNativeStackNavigator();

/**
 * Navegador de autenticação.
 * Gerencia o fluxo de navegação condicionalmente, com base no estado de autenticação do usuário.
 */
export const AuthNavigator = () => {
  // Estado para controlar se o usuário está autenticado.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Estado para controlar a exibição da tela de carregamento inicial.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica o status de autenticação quando o componente é montado.
    checkAuth();

    // Configura um intervalo para verificar periodicamente o status de autenticação.
    // Isso é útil para refletir mudanças de estado (login/logout) em tempo real.
    const interval = setInterval(checkAuth, 1000);

    // Função de limpeza: remove o intervalo quando o componente é desmontado para evitar vazamentos de memória.
    return () => clearInterval(interval);
  }, []);

  // Função assíncrona para verificar se o usuário está autenticado.
  const checkAuth = async () => {
    const authenticated = await authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    setLoading(false);
  };

  // Enquanto a verificação inicial está em andamento, exibe a tela de carregamento.
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    // O Stack.Navigator renderiza as telas com base no estado de autenticação.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Se o usuário estiver autenticado, renderiza o navegador principal do aplicativo.
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        // Caso contrário, renderiza a tela de Login.
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};
