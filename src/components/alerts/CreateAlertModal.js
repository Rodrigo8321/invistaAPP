import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { ALERT_TYPES, createAlert } from '../../services/alertService';

const CreateAlertModal = ({ visible, onClose, portfolio }) => {
  const [asset, setAsset] = useState(null);
  const [selectedType, setSelectedType] = useState(ALERT_TYPES.PRICE_ABOVE);
  const [targetValue, setTargetValue] = useState('');
  const [preview, setPreview] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // ========== RESET FORM ==========
  useEffect(() => {
    if (visible) {
      setAsset(null);
      setShowAssetPicker(true);
      setSelectedType(ALERT_TYPES.PRICE_ABOVE);
      setTargetValue('');
      setPreview('');
      setSearchQuery('');
    }
  }, [visible]);

  // ========== UPDATE PREVIEW ==========
  useEffect(() => {
    if (!asset || !targetValue) {
      setPreview('');
      return;
    }

    const value = parseFloat(targetValue);
    if (isNaN(value)) {
      setPreview('');
      return;
    }

    let description = '';
    switch (selectedType) {
      case ALERT_TYPES.PRICE_ABOVE:
        description = `${asset.ticker} atingir ${formatCurrency(value)}`;
        break;
      case ALERT_TYPES.PRICE_BELOW:
        description = `${asset.ticker} cair para ${formatCurrency(value)}`;
        break;
      case ALERT_TYPES.CHANGE_UP:
        description = `${asset.ticker} subir +${(value || 0).toFixed(1)}%`;
        break;
      case ALERT_TYPES.CHANGE_DOWN:
        description = `${asset.ticker} cair -${(value || 0).toFixed(1)}%`;
        break;
    }

    setPreview(description);
  }, [selectedType, targetValue, asset]);

  // ========== CREATE ALERT ==========
  const handleCreateAlert = async () => {
    if (!asset || !targetValue.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    // Specific validations
    if (selectedType === ALERT_TYPES.PRICE_ABOVE && value <= asset.currentPrice) {
      Alert.alert('Erro', 'O preço alvo deve ser maior que o preço atual');
      return;
    }

    if (selectedType === ALERT_TYPES.PRICE_BELOW && value >= asset.currentPrice) {
      Alert.alert('Erro', 'O preço alvo deve ser menor que o preço atual');
      return;
    }

    if ((selectedType === ALERT_TYPES.CHANGE_UP || selectedType === ALERT_TYPES.CHANGE_DOWN) && value > 100) {
      Alert.alert('Erro', 'A variação deve ser menor que 100%');
      return;
    }

    try {
      await createAlert(
        asset.ticker,
        asset.name,
        selectedType,
        value,
        asset.currentPrice
      );

      Alert.alert('Sucesso', 'Alerta criado com sucesso!');
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar alerta');
    }
  };

  // ========== CANCEL ==========
  const handleCancel = () => {
    onClose();
  };

  const handleSelectAsset = (selectedAsset) => {
    setAsset(selectedAsset);
    setShowAssetPicker(false);
    setTargetValue(selectedAsset.currentPrice.toFixed(2));
  };

  const filteredPortfolio = useMemo(() => {
    if (!searchQuery) {
      return portfolio;
    }
    return Array.isArray(portfolio)
      ? portfolio.filter(
          (asset) =>
            asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];
  }, [portfolio, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Criar Alerta</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {showAssetPicker ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Selecione um Ativo</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por ticker ou nome..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {filteredPortfolio.length > 0 ? (
                  filteredPortfolio.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.assetItem}
                      onPress={() => handleSelectAsset(item)}
                    >
                      <Text style={styles.assetItemTicker}>{item.ticker}</Text>
                      <Text style={styles.assetItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>🔍</Text>
                    <Text style={styles.emptyStateText}>
                      Nenhum ativo encontrado
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Verifique o ticker ou adicione o ativo ao seu portfólio.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* ASSET INFO */}
                <TouchableOpacity onPress={() => setShowAssetPicker(true)}>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetTicker}>{asset.ticker}</Text>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetPrice}>
                      Preço atual: {formatCurrency(asset.currentPrice)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* ALERT TYPE */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tipo de Alerta</Text>
                  <View style={styles.typeButtons}>
                    <TouchableOpacity
                      style={[styles.typeButton, selectedType === ALERT_TYPES.PRICE_ABOVE && styles.typeButtonActive]}
                      onPress={() => setSelectedType(ALERT_TYPES.PRICE_ABOVE)}
                    >
                      <Text style={styles.typeIcon}>📈</Text>
                      <Text style={[styles.typeText, selectedType === ALERT_TYPES.PRICE_ABOVE && styles.typeTextActive]}>
                        Preço Acima
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.typeButton, selectedType === ALERT_TYPES.PRICE_BELOW && styles.typeButtonActive]}
                      onPress={() => setSelectedType(ALERT_TYPES.PRICE_BELOW)}
                    >
                      <Text style={styles.typeIcon}>📉</Text>
                      <Text style={[styles.typeText, selectedType === ALERT_TYPES.PRICE_BELOW && styles.typeTextActive]}>
                        Preço Abaixo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.typeButton, selectedType === ALERT_TYPES.CHANGE_UP && styles.typeButtonActive]}
                      onPress={() => setSelectedType(ALERT_TYPES.CHANGE_UP)}
                    >
                      <Text style={styles.typeIcon}>🚀</Text>
                      <Text style={[styles.typeText, selectedType === ALERT_TYPES.CHANGE_UP && styles.typeTextActive]}>
                        Variação +
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.typeButton, selectedType === ALERT_TYPES.CHANGE_DOWN && styles.typeButtonActive]}
                      onPress={() => setSelectedType(ALERT_TYPES.CHANGE_DOWN)}
                    >
                      <Text style={styles.typeIcon}>⚠️</Text>
                      <Text style={[styles.typeText, selectedType === ALERT_TYPES.CHANGE_DOWN && styles.typeTextActive]}>
                        Variação -
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* TARGET VALUE */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {selectedType === ALERT_TYPES.PRICE_ABOVE || selectedType === ALERT_TYPES.PRICE_BELOW
                      ? 'Preço Alvo (R$)'
                      : 'Variação (%)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      selectedType === ALERT_TYPES.PRICE_ABOVE || selectedType === ALERT_TYPES.PRICE_BELOW
                        ? 'Ex: 150.00'
                        : 'Ex: 5.0'
                    }
                    placeholderTextColor={colors.textSecondary}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                  />
                </View>
                {/* PREVIEW */}
                {preview && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preview</Text>
                    <View style={styles.preview}>
                      <Text style={styles.previewText}>{preview}</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* BUTTONS */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateAlert}>
              <Text style={styles.createButtonText}>Criar Alerta</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  assetInfo: {
    padding: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  assetItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetItemTicker: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetItemName: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  assetTicker: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  assetName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  assetPrice: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  preview: {
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  previewText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CreateAlertModal;
