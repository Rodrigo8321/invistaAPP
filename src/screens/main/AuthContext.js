import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../../services/authService';

// 1. Cria o Contexto
const AuthContext = createContext();

/**
 * Provedor de Autenticação.
 * CORREÇÃO: Melhorada verificação inicial de autenticação
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se o usuário já está logado ao iniciar o app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Verificando autenticação...');

      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        // Busca dados do usuário armazenados
        const userData = await authService.getUser();

        if (userData) {
          console.log('✅ Usuário autenticado:', userData.email);
          setUser(userData);
        } else {
          console.log('⚠️ Token existe mas dados do usuário não encontrados');
          // Se tem token mas não tem dados, limpa tudo
          await authService.logout();
          setUser(null);
        }
      } else {
        console.log('❌ Usuário não autenticado');
        setUser(null);
      }
    } catch (e) {
      console.error("❌ Falha ao checar autenticação:", e);
      // Em caso de erro, limpa autenticação
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentando login...');
      const result = await authService.login(email, password);

      if (result.success) {
        console.log('✅ Login bem-sucedido!');
        setUser(result.user);
      } else {
        console.log('❌ Login falhou:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await authService.logout();
      setUser(null);
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 2. Cria o Hook customizado para usar o contexto facilmente
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
