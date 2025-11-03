import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/colors';
import { authService } from '../../services/authService';

// Componente da tela principal (Dashboard) após o login.
const DashboardScreen = ({ navigation }) => {
  // Função para lidar com o logout do usuário.
  const handleLogout = async () => {
    await authService.logout();
    // A navegação de volta para a tela de Login é tratada automaticamente
    // pelo AuthNavigator ao detectar a mudança no estado de autenticação.
  };

  return (
    // SafeAreaView garante que o conteúdo não se sobreponha a áreas do sistema (como o notch em iPhones).
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        {/* Botão para executar a função de logout. */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>✅ Login funcionando!</Text>
        <Text style={styles.subtitle}>Dashboard será construída aqui</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default DashboardScreen;
