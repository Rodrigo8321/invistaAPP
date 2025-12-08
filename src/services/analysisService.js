const safeToFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
};

export const analyzeAsset = (asset) => {
  const analysis = {
    recommendation: '',
    score: 0,
    strengths: [],
    weaknesses: [],
    alerts: [],
  };

  if (asset.type === 'Ação') {
    if (!asset.fundamentals) {
      console.warn(`⚠️ Análise de fundamentos para ${asset.ticker} (Ação) pulada: 'fundamentals' é undefined.`);
      return analysis; // Retorna análise parcial ou vazia
    }
    const f = asset.fundamentals;

    // P/L Analysis
    if (f.pl < 6) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'P/L Atrativo',
        value: safeToFixed(f.pl, 2),
        reason: 'Ação pode estar subvalorizada',
      });
    } else if (f.pl > 15) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'P/L Elevado',
        value: safeToFixed(f.pl, 2),
        reason: 'Possível sobrevalorização',
      });
    }

    // P/VP Analysis
    if (f.pvp < 1) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'P/VP < 1',
        value: safeToFixed(f.pvp, 2),
        reason: 'Negociando abaixo do valor patrimonial',
      });
    } else if (f.pvp > 2) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'P/VP Alto',
        value: safeToFixed(f.pvp, 2),
        reason: 'Prêmio elevado sobre patrimônio',
      });
    }

    // ROE Analysis
    if (f.roe > 20) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'ROE Excelente',
        value: safeToFixed(f.roe, 1) + '%',
        reason: 'Alta rentabilidade sobre patrimônio',
      });
    } else if (f.roe < 10) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'ROE Baixo',
        value: safeToFixed(f.roe, 1) + '%',
        reason: 'Rentabilidade abaixo da média',
      });
    }

    // Dividend Yield
    if (f.dy > 8) {
      analysis.score += 1;
      analysis.strengths.push({
        label: 'DY Atrativo',
        value: safeToFixed(f.dy, 1) + '%',
        reason: 'Bom pagamento de dividendos',
      });
    }

    // Margem Líquida
    if (f.margLiq > 20) {
      analysis.score += 1;
      analysis.strengths.push({
        label: 'Margem Saudável',
        value: safeToFixed(f.margLiq, 1) + '%',
        reason: 'Boa eficiência operacional',
      });
    } else if (f.margLiq < 10) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'Margem Baixa',
        value: safeToFixed(f.margLiq, 1) + '%',
        reason: 'Eficiência operacional limitada',
      });
    }

  } else if (asset.type === 'FII') {
    if (!asset.fundamentals) {
      console.warn(`⚠️ Análise de fundamentos para ${asset.ticker} (FII) pulada: 'fundamentals' é undefined.`);
      return analysis; // Retorna análise parcial ou vazia
    }
    const f = asset.fundamentals;

    // Dividend Yield
    if (f.dy > 10) {
      analysis.score += 2;
      analysis.strengths.push({
                  label: 'DY Excepcional',
                  value: safeToFixed(f.dy, 1) + '%',        reason: 'Rendimento muito atrativo',
      });
    } else if (f.dy < 6) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'DY Baixo',
        value: safeToFixed(f.dy, 1) + '%',
        reason: 'Rendimento abaixo da média para FII',
      });
    }

    // P/VP
    if (f.pvp < 0.95) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'Desconto ao Patrimônio',
        value: safeToFixed(f.pvp, 2),
        reason: 'Negociando com desconto',
      });
    } else if (f.pvp > 1.1) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'Prêmio ao Patrimônio',
        value: safeToFixed(f.pvp, 2),
        reason: 'Negociando com prêmio',
      });
    }

    // Vacância
    if (f.vacancia < 5) {
      analysis.score += 1;
      analysis.strengths.push({
        label: 'Vacância Baixa',
        value: safeToFixed(f.vacancia, 1) + '%',
        reason: 'Alta ocupação dos imóveis',
      });
    } else if (f.vacancia > 10) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'Vacância Elevada',
        value: safeToFixed(f.vacancia, 1) + '%',
        reason: 'Risco de redução de rendimentos',
      });
    }
  }

  // Performance Analysis
  let performance = null;
  if (typeof asset.currentPrice === 'number' && typeof asset.avgPrice === 'number' && asset.avgPrice !== 0) {
    performance = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
    if (performance > 20) {
      analysis.alerts.push(`Valorização de ${safeToFixed(performance, 1)}% - considere realizar lucros`);
    } else if (performance < -20) {
      analysis.alerts.push(`Desvalorização de ${safeToFixed(performance, 1)}% - reavalie a tese`);
    }
  } else {
    console.warn(`⚠️ Cálculo de performance para ${asset.ticker} pulado: preços inválidos (currentPrice: ${asset.currentPrice}, avgPrice: ${asset.avgPrice}).`);
  }

  // Final Recommendation
  if (analysis.score >= 5) {
    analysis.recommendation = 'FORTE COMPRA';
  } else if (analysis.score >= 3) {
    analysis.recommendation = 'COMPRAR';
  } else if (analysis.score >= 1) {
    analysis.recommendation = 'MANTER';
  } else if (analysis.score >= -1) {
    analysis.recommendation = 'OBSERVAR';
  } else {
    analysis.recommendation = 'VENDER';
  }

  return analysis;
};

export const getRecommendationColor = (recommendation) => {
  const colorMap = {
    'FORTE COMPRA': '#10b981',
    'COMPRAR': '#34d399',
    'MANTER': '#3b82f6',
    'OBSERVAR': '#fbbf24',
    'VENDER': '#ef4444',
  };
  return colorMap[recommendation] || '#6b7280';
};
