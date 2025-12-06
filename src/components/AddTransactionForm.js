import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { fetchQuote } from '../services/brapiService';

// Hook para debounce, evita chamadas de API a cada tecla digitada
const useDebounce = (callback, delay) => {
  const [timer, setTimer] = useState(null);
  return (...args) => {
    clearTimeout(timer);
    setTimer(setTimeout(() => callback(...args), delay));
  };
};

const AddTransactionForm = ({ onSave, onCancel }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Função para buscar o preço do ativo, com debounce de 500ms
  const debouncedFetchPrice = useCallback(
    useDebounce(async (currentTicker) => {
      if (currentTicker.length < 4) return; // Evita buscas por tickers incompletos

      setIsFetchingPrice(true);
      setStatusMessage('');
      try {
        const results = await fetchQuote(currentTicker.toUpperCase());
        if (results && results[0] && results[0].regularMarketPrice) {
          setPrice(results[0].regularMarketPrice.toString());
        } else {
          setStatusMessage('Ativo não encontrado.');
        }
      } catch (error) {
        setStatusMessage('Erro ao buscar preço.');
      } finally {
        setIsFetchingPrice(false);
      }
    }, 500),
    []
  );

  const handleTickerChange = (text) => {
    setTicker(text);
    debouncedFetchPrice(text);
  };

  // Lógica do botão principal: "Adicionar Transação"
  const handleAddTransaction = () => {
    // Validação simples
    if (!ticker || !quantity || !price) {
      Alert.alert('Campos incompletos', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    const transaction = {
      ticker: ticker.toUpperCase(),
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date: new Date().toISOString(),
    };

    // Simula o salvamento e chama a função onSave passada por props
    setTimeout(() => {
      console.log('Salvando transação:', transaction);
      if (onSave) {
        onSave(transaction);
      }
      setIsLoading(false);
      Alert.alert('Sucesso', 'Transação adicionada ao seu portfólio!');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Nova Transação</Text>

      <View>
        <TextInput
          style={styles.input}
          placeholder="Ticker (ex: MXRF11)"
          value={ticker}
          onChangeText={handleTickerChange}
          autoCapitalize="characters"
        />
        {isFetchingPrice && <ActivityIndicator size="small" />}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Preço por cota"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Quantidade"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}

      <Button title={isLoading ? 'Salvando...' : 'Adicionar Transação'} onPress={handleAddTransaction} disabled={isLoading || isFetchingPrice} />
      <View style={{ marginTop: 10 }}>
        <Button title="Cancelar" onPress={onCancel} disabled={isLoading} color="#888" />
      </View>
    </View>
  );
};

// Estilos simplificados
const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 15 },
  status: { textAlign: 'center', color: 'red', marginBottom: 10 },
});

export default AddTransactionForm;