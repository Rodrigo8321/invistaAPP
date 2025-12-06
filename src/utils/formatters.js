/**
 * Formata um número para uma string de moeda no padrão BRL (R$ 1.234,56).
 * @param {number} value - O número a ser formatado.
 * @param {string} currency - O código da moeda (padrão 'BRL').
 * @returns {string} A string formatada.
 */
export const formatCurrency = (value, currency = 'BRL') => {
  if (typeof value !== 'number' || isNaN(value)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(0);
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Converte uma string de moeda (com vírgula) para um número (com ponto).
 * Ex: "1.234,56" -> 1234.56
 * @param {string} value - A string a ser convertida.
 * @returns {number} O valor numérico.
 */
export const parseCurrency = (value) => {
  if (typeof value !== 'string' || !value) {
    return 0;
  }

  // Remove o símbolo de moeda e os separadores de milhar (pontos)
  const cleanedValue = value.replace(/[R$\s.]/g, '');
  // Substitui a vírgula decimal por um ponto
  const dotValue = cleanedValue.replace(',', '.');

  const number = parseFloat(dotValue);

  return isNaN(number) ? 0 : number;
};

/**
 * Formata um número como um percentual com o padrão brasileiro.
 * @param {number} value - O número a ser formatado (ex: 10.5 para 10,5%).
 * @returns {string} A string de percentual formatada.
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return '0,00%';
  }
  return `${value.toFixed(2).replace('.', ',')}%`;
};
