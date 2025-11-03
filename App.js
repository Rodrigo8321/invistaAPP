import React from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
/**
 * Componente principal (raiz) do aplicativo.
 * É o primeiro componente a ser renderizado.
 */
export default function App() {
  return (
    // Usamos um Fragment (<>) para agrupar múltiplos componentes sem adicionar um nó extra ao DOM.
    <>
      {/* Configura a barra de status do dispositivo (onde o relógio, bateria, etc. são exibidos).
          barStyle="light-content" torna o texto e os ícones da barra de status brancos.
          backgroundColor define a cor de fundo da barra de status (apenas para Android). */}
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {/* RootNavigator é o componente que gerencia toda a navegação do aplicativo. */}
      <RootNavigator />
    </>
  );
}
