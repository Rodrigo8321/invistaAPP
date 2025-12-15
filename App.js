import React, { useEffect } from 'react';
import 'react-native-gesture-handler';

// Importe os Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { PortfolioProvider } from './src/contexts/PortfolioContext';

// Importe o navegador raiz
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PortfolioProvider>
    </AuthProvider>
  );
}