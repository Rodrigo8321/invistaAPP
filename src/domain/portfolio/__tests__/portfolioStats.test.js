import { getPortfolioStats } from '../portfolioStats';

describe('getPortfolioStats', () => {
  it('calculates positive profit correctly', () => {
    const portfolio = [
      {
        ticker: 'PETR4',
        quantity: 100,
        totalInvested: 10000,
        monthlyDividends: 50,
        type: 'Stock',
        currency: 'BRL',
      },
    ];
    const realPrices = { PETR4: { price: 120, change: 0 } };
    const exchangeRate = 5.0;

    const result = getPortfolioStats({ portfolio, realPrices, exchangeRate });

    expect(result.diversificationCount).toBe(1);
    expect(result.totalInvested).toBe(10000);
    expect(result.totalCurrent).toBe(12000);
    expect(result.profit).toBe(2000);
    expect(result.profitabilityPercent).toBe(20);
    expect(result.totalMonthlyDividends).toBe(50);
  });

  it('calculates negative profit correctly', () => {
    const portfolio = [
      {
        ticker: 'VALE3',
        quantity: 50,
        totalInvested: 4000,
        monthlyDividends: 30,
        type: 'Stock',
        currency: 'BRL',
      },
    ];
    const realPrices = { VALE3: { price: 70, change: 0 } };
    const exchangeRate = 5.0;

    const result = getPortfolioStats({ portfolio, realPrices, exchangeRate });

    expect(result.diversificationCount).toBe(1);
    expect(result.totalInvested).toBe(4000);
    expect(result.totalCurrent).toBe(3500);
    expect(result.profit).toBe(-500);
    expect(result.profitabilityPercent).toBe(-12.5);
    expect(result.totalMonthlyDividends).toBe(30);
  });

  it('calculates diversification correctly', () => {
    const portfolio = [
      {
        ticker: 'PETR4',
        quantity: 100,
        totalInvested: 10000,
        monthlyDividends: 50,
        type: 'Stock',
        currency: 'BRL',
      },
      {
        ticker: 'VALE3',
        quantity: 50,
        totalInvested: 4000,
        monthlyDividends: 30,
        type: 'Stock',
        currency: 'BRL',
      },
      {
        ticker: 'ITUB4',
        quantity: 200,
        totalInvested: 8000,
        monthlyDividends: 40,
        type: 'Stock',
        currency: 'BRL',
      },
    ];
    const realPrices = { PETR4: { price: 120, change: 0 }, VALE3: { price: 70, change: 0 }, ITUB4: { price: 50, change: 0 } };
    const exchangeRate = 5.0;

    const result = getPortfolioStats({ portfolio, realPrices, exchangeRate });

    expect(result.diversificationCount).toBe(3);
    expect(result.totalInvested).toBe(22000);
    expect(result.totalCurrent).toBe(24000);
    expect(result.profit).toBe(2000);
    expect(result.profitabilityPercent).toBeCloseTo(9.09, 2);
    expect(result.totalMonthlyDividends).toBe(120);
  });

  it('calculates monthly dividends correctly', () => {
    const portfolio = [
      {
        ticker: 'PETR4',
        quantity: 100,
        totalInvested: 10000,
        monthlyDividends: 50,
        type: 'Stock',
        currency: 'BRL',
      },
      {
        ticker: 'VALE3',
        quantity: 50,
        totalInvested: 4000,
        monthlyDividends: 30,
        type: 'Stock',
        currency: 'BRL',
      },
    ];
    const realPrices = { PETR4: { price: 120, change: 0 }, VALE3: { price: 70, change: 0 } };
    const exchangeRate = 5.0;

    const result = getPortfolioStats({ portfolio, realPrices, exchangeRate });

    expect(result.totalMonthlyDividends).toBe(80);
  });
});
