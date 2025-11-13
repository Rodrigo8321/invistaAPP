# Erros Identificados e Correções Necessárias

## 1. PriceChart.js - Biblioteca incompatível

- **Problema**: Usa 'recharts' (web-only) em React Native
- **Solução**: Substituir por gráfico simples usando View ou instalar biblioteca compatível

## 2. marketService.js - Timeout no fetch

- **Problema**: fetch() não suporta parâmetro timeout no React Native
- **Solução**: Implementar timeout manual com AbortController

## 3. SettingsScreen.js - AuthContext inexistente

- **Problema**: Importa AuthContext que não existe
- **Solução**: Remover import e funcionalidades de auth ou criar contexto

## 4. TransactionHistoryScreen.js - Props do modal

- **Problema**: Passa props incorretas para TransactionModal
- **Solução**: Corrigir props passadas para o modal

## 5. TransactionModal.js - Parsing de preço

- **Problema**: Bug no parsing de preço com separador decimal
- **Solução**: Corrigir lógica de conversão de string para número
