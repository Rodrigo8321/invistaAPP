import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';

/**
 * Componente raiz da navegação do aplicativo.
 * Ele envolve toda a estrutura de navegação com o NavigationContainer.
 */
const RootNavigator = () => {
  return (
    // NavigationContainer é o componente que gerencia o estado da navegação
    // e vincula o navegador de nível superior ao ambiente do aplicativo.
    <NavigationContainer>
      {/* AuthNavigator é o primeiro navegador a ser renderizado.
          Ele decide qual fluxo de navegação mostrar (autenticação ou principal). */}
      <AuthNavigator />
    </NavigationContainer>
  );
};

export default RootNavigator;
