import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

const StatCard = ({ icon, label, value, subValue, backgroundColor }) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subValue && (
        <View style={styles.subValueContainer}>
          <Text style={styles.subValue}>{subValue}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    padding: 20,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 10,
  },
  label: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subValueContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default StatCard;
