import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { PortfolioProvider } from './src/contexts/PortfolioContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PortfolioProvider>
    </AuthProvider>
  );
}
