import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves usadas para armazenar dados no AsyncStorage.
const AUTH_TOKEN_KEY = '@InvestPro:token';
const USER_DATA_KEY = '@InvestPro:user';

// Objeto que encapsula toda a lógica de autenticação.
export const authService = {
  /**
   * Simula o processo de login de um usuário.
   * @param {string} email - O email do usuário.
   * @param {string} password - A senha do usuário.
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(email, password) {
    try {
      console.log('🔐 Login:', email);

      // Simula uma chamada de rede com um atraso de 1 segundo.
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Lógica de validação de credenciais (mock).
      if (email && password.length >= 6) {
        const mockUser = {
          id: '1',
          name: email.split('@')[0],
          email: email,
        };

        const mockToken = 'token-' + Date.now();

        // Armazena o token e os dados do usuário no armazenamento local.
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));

        console.log('✅ Login bem-sucedido!');
        return { success: true, user: mockUser };
      }

      console.log('❌ Credenciais inválidas');
      return { success: false, error: 'Credenciais inválidas' };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  },

  /**
   * Realiza o logout do usuário, removendo os dados de autenticação do armazenamento.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async logout() {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      console.log('🚪 Logout realizado');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao fazer logout' };
    }
  },

  /**
   * Verifica se existe um token de autenticação armazenado.
   * @returns {Promise<boolean>} - Retorna `true` se o usuário estiver autenticado, `false` caso contrário.
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      // A conversão para booleano (!!) garante que o retorno seja true ou false.
      return !!token;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtém os dados do usuário autenticado do armazenamento.
   * @returns {Promise<object|null>} - Retorna o objeto do usuário ou null se não for encontrado.
   */
  async getUser() {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },
};
