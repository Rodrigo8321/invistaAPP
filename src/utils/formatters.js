/**
 * Formata um número como moeda brasileira (BRL).
 * @param {number} value - O valor numérico a ser formatado.
 * @returns {string} - O valor formatado como string (ex: "R$ 1.234,56").
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
/**
 * Formata um número como uma porcentagem, com um sinal de '+' para valores positivos.
 * @param {number} value - O valor numérico a ser formatado.
 * @param {number} [decimals=2] - O número de casas decimais a serem exibidas.
 * @returns {string} - O valor formatado como string (ex: "+5.20%").
 */
export const formatPercent = (value, decimals = 2) => {
  // Adiciona um sinal de '+' se o valor for positivo ou zero.
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};
