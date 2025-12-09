import { API_CONFIG, buildURL, logAPICall, isBrapiConfigured } from '../config/apiConfig';

const { brapi } = API_CONFIG;

/**
 * Busca a cotação mais recente de um ou mais tickers na API da Brapi.
 * @param {string} tickers - Uma string com um ou mais tickers separados por vírgula (ex: "MXRF11,PETR4").
 * @returns {Promise<object>} Os dados da cotação.
 */
export const fetchQuote = async (tickers) => {
  if (!isBrapiConfigured()) {
    const errorMessage = 'API da Brapi não configurada. Verifique o token em .env';
    logAPICall('brapi', `/quote/${tickers}`, 'Error - No Token');
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const endpoint = `/quote/${tickers}`;
  const url = buildURL(brapi.baseUrl, endpoint, { range: '1d' });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${brapi.apiKey}`, // Usa a chave da configuração
      },
    });

    if (!response.ok) {
      logAPICall('brapi', endpoint, `Error - ${response.status}`);
      throw new Error(`Erro na API da Brapi: ${response.statusText}`);
    }

    const data = await response.json();
    logAPICall('brapi', endpoint, 'Success');
    return data.results; // A API da Brapi retorna os resultados em um array 'results'
  } catch (error) {
    logAPICall('brapi', endpoint, `Error - ${error.message}`);
    console.error(`Falha ao buscar cotação da Brapi: ${error.message}`);
    throw error; // Re-lança o erro para o componente que chamou poder tratar
  }
};