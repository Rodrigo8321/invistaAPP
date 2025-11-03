import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/main/DashboardScreen';

// Cria uma instância do navegador de pilha nativo.
const Stack = createNativeStackNavigator();

/**
 * Navegador para a seção principal do aplicativo, acessível após o login.
 * Contém todas as telas que o usuário autenticado pode acessar.
 */
export const AppNavigator = () => {
  return (
    // O Stack.Navigator é o componente que define a estrutura da pilha de navegação.
    // screenOptions={{ headerShown: false }} oculta o cabeçalho padrão em todas as telas deste navegador.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Define a tela 'Dashboard' como parte desta pilha de navegação. */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
};
