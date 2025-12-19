# Correções para erro "TypeError: Cannot read property 'toFixed' of undefined"

## Problema

O erro ocorre quando componentes tentam chamar `.toFixed()` em valores `undefined` ou `NaN` dos dados do portfólio.

## Correções Necessárias

### ✅ 1. PortfolioSummary.js

- [x] Corrigir `Math.abs(stats.profitPercent).toFixed(2)` para lidar com valores undefined/NaN

### ✅ 2. PerformanceComparison.js

- [x] Corrigir `Math.abs(asset.performance || 0).toFixed(2)` para validação mais robusta

### ✅ 3. RecommendationsCard.js

- [ ] Corrigir `(avgPerformance || 0).toFixed(2)` para validação mais robusta

### ✅ 4. DiversificationChart.js

- [ ] Corrigir `((item.value / total) * 100).toFixed(1)` para validar item.value e total

### ✅ 5. SectorDistribution.js

- [ ] Corrigir `((item.value / total) * 100).toFixed(1)` para validar item.value e total

## Estratégia de Correção

- Usar função helper `safeToFixed(value, decimals = 2)` que verifica se o valor é um número válido
- Retornar '0.00' ou valor padrão apropriado para casos inválidos
- Garantir que cálculos de percentual sejam seguros

## Testes

- [ ] Executar testes para verificar que o erro foi corrigido
- [ ] Verificar que a aplicação funciona corretamente com dados do portfólio
