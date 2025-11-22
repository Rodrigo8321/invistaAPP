import React, { useState, useEffect } from 'react';
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

const CreateAlertModal = ({ visible, onClose, asset }) => {
  const [selectedType, setSelectedType] = useState(ALERT_TYPES.PRICE_ABOVE);
  const [targetValue, setTargetValue] = useState('');
  const [preview, setPreview] = useState('');

  // ========== RESET FORM ==========
  useEffect(() => {
    if (visible && asset) {
      setSelectedType(ALERT_TYPES.PRICE_ABOVE);
      setTargetValue('');
      setPreview('');
    }
  }, [visible, asset]);

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
        description = `${asset.ticker} reach ${formatCurrency(value)}`;
        break;
      case ALERT_TYPES.PRICE_BELOW:
        description = `${asset.ticker} fall to ${formatCurrency(value)}`;
        break;
      case ALERT_TYPES.CHANGE_UP:
        description = `${asset.ticker} rise +${value.toFixed(1)}%`;
        break;
      case ALERT_TYPES.CHANGE_DOWN:
        description = `${asset.ticker} fall -${value.toFixed(1)}%`;
        break;
    }

    setPreview(description);
  }, [selectedType, targetValue, asset]);

  // ========== CREATE ALERT ==========
  const handleCreateAlert = async () => {
    if (!asset || !targetValue.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Invalid value');
      return;
    }

    // Specific validations
    if (selectedType === ALERT_TYPES.PRICE_ABOVE && value <= asset.currentPrice) {
      Alert.alert('Error', 'Target price must be higher than current price');
      return;
    }

    if (selectedType === ALERT_TYPES.PRICE_BELOW && value >= asset.currentPrice) {
      Alert.alert('Error', 'Target price must be lower than current price');
      return;
    }

    if ((selectedType === ALERT_TYPES.CHANGE_UP || selectedType === ALERT_TYPES.CHANGE_DOWN) && value > 100) {
      Alert.alert('Error', 'Change must be less than 100%');
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

      Alert.alert('Success', 'Alert created successfully!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create alert');
    }
  };

  // ========== CANCEL ==========
  const handleCancel = () => {
    onClose();
  };

  if (!asset) return null;

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
            <Text style={styles.title}>Create Alert</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ASSET INFO */}
          <View style={styles.assetInfo}>
            <Text style={styles.assetTicker}>{asset.ticker}</Text>
            <Text style={styles.assetName}>{asset.name}</Text>
            <Text style={styles.assetPrice}>
              Current price: {formatCurrency(asset.currentPrice)}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* ALERT TYPE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alert Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === ALERT_TYPES.PRICE_ABOVE && styles.typeButtonActive
                  ]}
                  onPress={() => setSelectedType(ALERT_TYPES.PRICE_ABOVE)}
                >
                  <Text style={styles.typeIcon}>📈</Text>
                  <Text style={[
                    styles.typeText,
                    selectedType === ALERT_TYPES.PRICE_ABOVE && styles.typeTextActive
                  ]}>
                    Price Above
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === ALERT_TYPES.PRICE_BELOW && styles.typeButtonActive
                  ]}
                  onPress={() => setSelectedType(ALERT_TYPES.PRICE_BELOW)}
                >
                  <Text style={styles.typeIcon}>📉</Text>
                  <Text style={[
                    styles.typeText,
                    selectedType === ALERT_TYPES.PRICE_BELOW && styles.typeTextActive
                  ]}>
                    Price Below
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === ALERT_TYPES.CHANGE_UP && styles.typeButtonActive
                  ]}
                  onPress={() => setSelectedType(ALERT_TYPES.CHANGE_UP)}
                >
                  <Text style={styles.typeIcon}>🚀</Text>
                  <Text style={[
                    styles.typeText,
                    selectedType === ALERT_TYPES.CHANGE_UP && styles.typeTextActive
                  ]}>
                    Change +
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === ALERT_TYPES.CHANGE_DOWN && styles.typeButtonActive
                  ]}
                  onPress={() => setSelectedType(ALERT_TYPES.CHANGE_DOWN)}
                >
                  <Text style={styles.typeIcon}>⚠️</Text>
                  <Text style={[
                    styles.typeText,
                    selectedType === ALERT_TYPES.CHANGE_DOWN && styles.typeTextActive
                  ]}>
                    Change -
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TARGET VALUE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedType === ALERT_TYPES.PRICE_ABOVE || selectedType === ALERT_TYPES.PRICE_BELOW
                  ? 'Target Price (R$)'
                  : 'Change (%)'
                }
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

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* BUTTONS */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateAlert}>
              <Text style={styles.createButtonText}>Create Alert</Text>
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
});

export default CreateAlertModal;
