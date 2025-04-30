const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('sumTotalBalances Function', () => {
  it('should calculate the total balance by summing income and expense totals for each period', () => {
    const data = {
      periods : ['202501', '202502', '202503'],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const expenseTotal = {
      202501 : 50,
      202502 : 75,
      202503 : 100,
    };

    const result = cashflowFunction.sumTotalBalances(data, incomeTotal, expenseTotal);

    expect(result).to.equal(675);
  });

  it('should return 0 if there are no periods', () => {
    const data = {
      periods : [],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const expenseTotal = {
      202501 : 50,
      202502 : 75,
      202503 : 100,
    };

    const result = cashflowFunction.sumTotalBalances(data, incomeTotal, expenseTotal);

    expect(result).to.equal(0); // No periods, so the sum is 0
  });

  it('should handle periods with missing income or expense data', () => {
    const data = {
      periods : ['202501', '202502', '202503', '202504'],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const expenseTotal = {
      202501 : 50,
      202502 : 75,
    };

    const result = cashflowFunction.sumTotalBalances(data, incomeTotal, expenseTotal);

    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.NaN;
  });

  it('should return NaN if all periods have missing data', () => {
    const data = {
      periods : ['202501', '202502', '202503', '202504'],
    };

    const incomeTotal = {};
    const expenseTotal = {};

    const result = cashflowFunction.sumTotalBalances(data, incomeTotal, expenseTotal);

    expect(result).to.be.a('number');
    // eslint-disable-next-line no-unused-expressions
    expect(Number.isNaN(result)).to.be.true;
  });
});
