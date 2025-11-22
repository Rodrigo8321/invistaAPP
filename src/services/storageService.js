import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockPortfolio } from '../data/mockAssets';

const STORAGE_KEYS = {
  PORTFOLIO: 'invistaapp_portfolio',
  USER_PREFERENCES: 'invistaapp_preferences',
  APP_VERSION: 'invistaapp_version',
};

// Versão atual do schema de dados
const CURRENT_VERSION = '1.0.0';

/**
 * Serviço de armazenamento local usando AsyncStorage
 */
class StorageService {
  /**
   * Carrega o portfolio salvo ou retorna dados iniciais
   */
  async loadPortfolio() {
    try {
      const savedPortfolio = await AsyncStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      const appVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);

      if (savedPortfolio && appVersion === CURRENT_VERSION) {
        const portfolio = JSON.parse(savedPortfolio);
        console.log('✅ Portfolio carregado do storage:', portfolio.length, 'ativos');
        return portfolio;
      } else {
        // Primeira execução ou versão antiga - usar dados iniciais
        console.log('📝 Usando dados iniciais do portfolio');
        await this.savePortfolio(mockPortfolio);
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION);
        return mockPortfolio;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar portfolio:', error);
      return mockPortfolio; // Fallback para dados iniciais
    }
  }

  /**
   * Salva o portfolio no storage
   */
  async savePortfolio(portfolio) {
    try {
      const portfolioString = JSON.stringify(portfolio);
      await AsyncStorage.setItem(STORAGE_KEYS.PORTFOLIO, portfolioString);
      console.log('💾 Portfolio salvo:', portfolio.length, 'ativos');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar portfolio:', error);
      return false;
    }
  }

  /**
   * Adiciona um novo ativo ao portfolio
   */
  async addAsset(asset) {
    try {
      const portfolio = await this.loadPortfolio();
      const newAsset = {
        ...asset,
        id: Date.now().toString(), // Gera ID único
        dateAdded: new Date().toISOString(),
      };

      portfolio.push(newAsset);
      await this.savePortfolio(portfolio);
      console.log('➕ Ativo adicionado:', newAsset.ticker);
      return newAsset;
    } catch (error) {
      console.error('❌ Erro ao adicionar ativo:', error);
      throw error;
    }
  }

  /**
   * Atualiza um ativo existente
   */
  async updateAsset(assetId, updates) {
    try {
      const portfolio = await this.loadPortfolio();
      const assetIndex = portfolio.findIndex(asset => asset.id === assetId);

      if (assetIndex === -1) {
        throw new Error('Ativo não encontrado');
      }

      portfolio[assetIndex] = {
        ...portfolio[assetIndex],
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      await this.savePortfolio(portfolio);
      console.log('✏️ Ativo atualizado:', portfolio[assetIndex].ticker);
      return portfolio[assetIndex];
    } catch (error) {
      console.error('❌ Erro ao atualizar ativo:', error);
      throw error;
    }
  }

  /**
   * Remove um ativo do portfolio
   */
  async removeAsset(assetId) {
    try {
      const portfolio = await this.loadPortfolio();
      const filteredPortfolio = portfolio.filter(asset => asset.id !== assetId);

      if (filteredPortfolio.length === portfolio.length) {
        throw new Error('Ativo não encontrado');
      }

      await this.savePortfolio(filteredPortfolio);
      console.log('🗑️ Ativo removido, portfolio agora tem:', filteredPortfolio.length, 'ativos');
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover ativo:', error);
      throw error;
    }
  }

  /**
   * Carrega preferências do usuário
   */
  async loadUserPreferences() {
    try {
      const preferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return preferences ? JSON.parse(preferences) : {
        theme: 'light',
        currency: 'BRL',
        notifications: true,
        autoRefresh: true,
      };
    } catch (error) {
      console.error('❌ Erro ao carregar preferências:', error);
      return {};
    }
  }

  /**
   * Salva preferências do usuário
   */
  async saveUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      console.log('⚙️ Preferências salvas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar preferências:', error);
      return false;
    }
  }

  /**
   * Limpa todos os dados (usar com cuidado!)
   */
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PORTFOLIO,
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.APP_VERSION,
      ]);
      console.log('🧹 Todos os dados foram limpos');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      return false;
    }
  }

  /**
   * Verifica se há dados salvos
   */
  async hasSavedData() {
    try {
      const portfolio = await AsyncStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      return !!portfolio;
    } catch (error) {
      return false;
    }
  }
}

// Exportar instância singleton
export default new StorageService();
