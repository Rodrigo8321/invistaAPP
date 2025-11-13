import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { colors } from '../../styles/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [clearing, setClearing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Deseja realmente sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: async () => {
            // Simular logout removendo dados de autenticação
            await AsyncStorage.removeItem('@InvestPro:user');
            Alert.alert('✅ Logout', 'Você foi desconectado com sucesso.');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Limpar Todos os Dados',
      'Isso vai apagar TODOS os dados do app (watchlist, transações, etc). Deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar Tudo',
          onPress: async () => {
            setClearing(true);
            try {
              // Limpa todo o AsyncStorage
              await AsyncStorage.clear();
              
              Alert.alert(
                '✅ Sucesso',
                'Todos os dados foram apagados.',
                [
                  {
                    text: 'OK',
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar os dados');
            } finally {
              setClearing(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Configurações</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Seção Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Conta</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogout}
          >
            <Text style={styles.buttonIcon}>🚪</Text>
            <Text style={styles.buttonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        {/* Seção Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Dados do App</Text>
          
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              A opção abaixo vai apagar TODOS os dados armazenados no app, incluindo:
              {'\n'}• Watchlist/Favoritos
              {'\n'}• Histórico de transações
              {'\n'}• Configurações salvas
              {'\n'}• Token de autenticação
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearAllData}
            disabled={clearing}
          >
            <Text style={styles.buttonIcon}>🗑️</Text>
            <Text style={styles.buttonText}>
              {clearing ? 'Limpando...' : 'Limpar Todos os Dados'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seção Sobre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Sobre</Text>
          
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>InvestPro</Text>
            <Text style={styles.aboutVersion}>Versão 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              App de gerenciamento de investimentos em ações e FIIs.
            </Text>
          </View>
        </View>



        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },

  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningCard: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  aboutCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aboutVersion: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  aboutDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

});

export default SettingsScreen;
