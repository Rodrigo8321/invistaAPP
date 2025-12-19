import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ title, value, subtitle, valueColor }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={[styles.value, valueColor && { color: valueColor }]}>
        {value}
      </Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    color: '#aaa',
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
});
