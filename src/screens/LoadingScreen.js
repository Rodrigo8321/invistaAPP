import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

/**
 * Uma tela de carregamento simples exibida enquanto os dados são buscados,
 * como durante a verificação inicial de autenticação.
 */
const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,                    // Ocupa toda a tela
    justifyContent: 'center',   // Centraliza verticalmente
    alignItems: 'center',       // Centraliza horizontalmente
    backgroundColor: colors.background, // Fundo dark
  },
});

export default LoadingScreen;
