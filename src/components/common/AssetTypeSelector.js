import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import colors from '../../styles/colors';

const AssetTypeSelector = ({ selectedType, selectedCountry, onTypeChange, onCountryChange }) => {
  const countries = [
    { id: 'all', label: 'Todos', flag: '🌍' },
    { id: 'BR', label: 'Brasil', flag: '🇧🇷' },
    { id: 'US', label: 'EUA', flag: '🇺🇸' },
    { id: 'Global', label: 'Crypto', flag: '💰' },
  ];

  const types = [
    { id: 'all', label: 'Todos', icon: '📊' },
    { id: 'Ação', label: 'Ações', icon: '📈' },
    { id: 'FII', label: 'FIIs', icon: '🏢' },
    { id: 'Stock', label: 'Stocks', icon: '🇺🇸' },
    { id: 'REIT', label: 'REITs', icon: '🏘️' },
    { id: 'ETF', label: 'ETFs', icon: '📦' },
    { id: 'Crypto', label: 'Cripto', icon: '💰' },
  ];

  return (
    <View style={styles.container}>
      {/* Filtro por País */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>País</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {countries.map(country => (
            <TouchableOpacity
              key={country.id}
              style={[
                styles.filterChip,
                selectedCountry === country.id && styles.filterChipActive
              ]}
              onPress={() => onCountryChange(country.id)}
            >
              <Text style={styles.filterIcon}>{country.flag}</Text>
              <Text style={[
                styles.filterText,
                selectedCountry === country.id && styles.filterTextActive
              ]}>
                {country.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtro por Tipo */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tipo de Ativo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {types.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterChip,
                selectedType === type.id && styles.filterChipActive
              ]}
              onPress={() => onTypeChange(type.id)}
            >
              <Text style={styles.filterIcon}>{type.icon}</Text>
              <Text style={[
                styles.filterText,
                selectedType === type.id && styles.filterTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
});

export default AssetTypeSelector;
