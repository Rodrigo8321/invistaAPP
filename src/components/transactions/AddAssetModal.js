import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../styles/colors';

const assetTypes = ['Ação', 'FII', 'Stock', 'REIT', 'ETF', 'Crypto'];
const countries = [
  { label: 'Brasil', value: '🇧🇷' },
  { label: 'USA', value: '🇺🇸' },
  { label: 'Crypto', value: '🌐' },
];

const AddAssetModal = ({ visible, onClose, onAddAsset }) => {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(assetTypes[0]);
  const [country, setCountry] = useState(countries[0].value);
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTicker('');
    setName('');
    setType(assetTypes[0]);
    setCountry(countries[0].value);
    setQuantity('');
    setAveragePrice('');
  };

  const handleAdd = async () => {
    if (!ticker.trim() || !name.trim() || !quantity.trim() || !averagePrice.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const qty = parseFloat(quantity);
    const avgPrice = parseFloat(averagePrice.replace(',', '.').replace(/\s/g, ''));

    if (isNaN(qty) || isNaN(avgPrice) || qty <= 0 || avgPrice <= 0) {
      Alert.alert('Erro', 'Quantidade e preço médio devem ser números maiores que zero.');
      return;
    }

    setLoading(true);
    try {
      const newAsset = {
        ticker: ticker.toUpperCase(),
        name,
        type,
        country,
        quantity: qty,
        averagePrice: avgPrice,
        currentPrice: avgPrice, // Initialize currentPrice same as averagePrice
      };

      await onAddAsset(newAsset);
      Alert.alert('Sucesso', `Ativo ${newAsset.ticker} adicionado ao portfólio!`);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao adicionar ativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar Novo Ativo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Ticker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ticker *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: PETR4"
                placeholderTextColor={colors.textSecondary}
                value={ticker}
                onChangeText={setTicker}
                autoCapitalize="characters"
              />
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Petrobras"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo *</Text>
              <View style={styles.selectionRow}>
                {assetTypes.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.selectionOption, type === t && styles.selectionOptionActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.selectionText, type === t && styles.selectionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>País *</Text>
              <View style={styles.selectionRow}>
                {countries.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.selectionOption, country === c.value && styles.selectionOptionActive]}
                    onPress={() => setCountry(c.value)}
                  >
                    <Text style={[styles.selectionText, country === c.value && styles.selectionTextActive]}>
                      {c.label} {c.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantidade *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 100"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            {/* Average Price */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preço Médio (BRL) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 25.50"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={averagePrice}
                onChangeText={setAveragePrice}
              />
            </View>

            {/* Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAdd} style={[styles.button, styles.addButton]} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addText}>Adicionar</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectionOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 12,
    marginBottom: 8,
  },
  selectionOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectionTextActive: {
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddAssetModal;
