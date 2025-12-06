import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';

// Simulando uma chamada de API que leva 2 segundos para ser concluída.
const simulateApiCall = (ticker, amount) => {
  console.log(`Iniciando a compra de ${amount} de ${ticker}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Compra realizada com sucesso!');
      resolve({ success: true, ticker, amount });
    }, 2000);
  });
};

const ActionButtonExample = ({ ticker, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  /**
   * Lógica do botão "com mais poder" (Ação Primária).
   * Ele tem um estado de carregamento e executa a principal tarefa.
   */
  const handlePrimaryAction = async () => {
    setIsLoading(true); // Inicia o feedback visual (loading)
    setStatusMessage('');

    try {
      const result = await simulateApiCall(ticker, 100); // Executa a lógica principal
      if (result.success) {
        setStatusMessage(`Ativo ${ticker} comprado com sucesso!`);
      }
    } catch (error) {
      setStatusMessage('Falha ao realizar a compra.');
      console.error(error);
    } finally {
      setIsLoading(false); // Finaliza o feedback visual
    }
  };

  /**
   * Lógica do botão "contrário" (Ação Secundária).
   * Ação simples e imediata, como fechar a tela.
   */
  const handleSecondaryAction = () => {
    console.log('Ação cancelada pelo usuário.');
    if (onCancel) {
      onCancel(); // Chama a função passada por props para fechar o componente
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar Compra de {ticker}</Text>

      {/* O botão primário é desabilitado durante o carregamento */}
      <Button
        title={isLoading ? 'Processando...' : `Comprar ${ticker}`}
        onPress={handlePrimaryAction}
        disabled={isLoading}
        color="#007AFF" // Cor de destaque para a ação primária
      />

      {/* Indicador de atividade para melhor feedback */}
      {isLoading && <ActivityIndicator size="large" color="#007AFF" />}

      {/* O botão secundário permanece habilitado */}
      <View style={{ marginTop: 10 }}>
        <Button title="Cancelar" onPress={handleSecondaryAction} disabled={isLoading} color="#FF3B30" />
      </View>

      {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
    </View>
  );
};

// Estilos para o exemplo (simplificado)
const styles = StyleSheet.create({ /* ... estilos aqui ... */ });

export default ActionButtonExample;