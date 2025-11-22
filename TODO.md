## Correções Pendentes no Projeto

### 1. TransactionHistoryScreen.js - Props incorretas para TransactionModal

- **Problema**: Passa `asset` (objeto único) mas TransactionModal espera `portfolio` (array)
- **Solução**: Alterar prop para `portfolio={mockPortfolio}` e remover lógica de pré-seleção de ativo

### 2. Verificar TransactionModal.js - Parsing de preço

- **Verificar**: Lógica de conversão de string para número com separador decimal
- **Ação**: Confirmar se está funcionando corretamente

### 3. Verificar SettingsScreen.js - AuthContext

- **Verificar**: Import e uso do AuthContext (parece estar correto)
- **Ação**: Confirmar se não há erros de import

### 4. Testar aplicação após correções

- **Ação**: Executar app e verificar se erros foram resolvidos
