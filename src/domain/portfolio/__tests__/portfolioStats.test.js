import { getPortfolioStats } from '../portfolioStats';

describe('getPortfolioStats', () => {
  it('deve calcular corretamente os totais da carteira com lucro', () => {
    const portfolio = [
      {
        ticker: 'PETR4',
        quantity: 10,
        totalInvested: 280,
        monthlyDividends: 120,
      },
      {
        ticker: 'HGLG11',
        quantity: 5,
        totalInvested: 800,
        monthlyDividends: 95,
      },
    ];

    const prices = {
      PETR4: 30,
      HGLG11: 165,
    };

    const stats = getPortfolioStats({ portfolio, prices });

    expect(stats.totalInvested).toBe(1080);
    expect(stats.totalCurrent).toBe(10 * 30 + 5 * 165);
    expect(stats.profit).toBeGreaterThan(0);
    expect(stats.profitabilityPercent).toBeGreaterThan(0);
    expect(stats.diversificationCount).toBe(2);
    expect(stats.totalMonthlyDividends).toBe(215);
  });

  it('deve calcular corretamente prejuízo na carteira', () => {
    const portfolio = [
      {
        ticker: 'VALE3',
        quantity: 10,
        totalInvested: 900,
        monthlyDividends: 0,
      },
    ];

    const prices = {
      VALE3: 80,
    };

    const stats = getPortfolioStats({ portfolio, prices });

    expect(stats.totalInvested).toBe(900);
    expect(stats.totalCurrent).toBe(800);
    expect(stats.profit).toBe(-100);
    expect(stats.profitabilityPercent).toBeLessThan(0);
  });

  it('deve contar corretamente a diversificação (tickers únicos)', () => {
    const portfolio = [
      { ticker: 'ITUB4', quantity: 10, totalInvested: 200 },
      { ticker: 'ITUB4', quantity: 5, totalInvested: 100 },
      { ticker: 'MXRF11', quantity: 20, totalInvested: 220 },
    ];

    const prices = {
      ITUB4: 25,
      MXRF11: 11,
    };

    const stats = getPortfolioStats({ portfolio, prices });

    expect(stats.diversificationCount).toBe(2);
  });

  it('não deve quebrar quando a carteira estiver vazia', () => {
    const portfolio = [];
    const prices = {};

    const stats = getPortfolioStats({ portfolio, prices });

    expect(stats.totalInvested).toBe(0);
    expect(stats.totalCurrent).toBe(0);
    expect(stats.profit).toBe(0);
    expect(stats.profitabilityPercent).toBe(0);
    expect(stats.diversificationCount).toBe(0);
    expect(stats.totalMonthlyDividends).toBe(0);
  });
});
