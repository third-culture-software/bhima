const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('totalBalances Function', () => {
  it('should calculate the total for each period based on income and transfer totals', () => {
    const data = {
      periods : ['202501', '202502', '202503'],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    const result = cashflowFunction.totalBalances(data, incomeTotal, transferTotal);

    expect(result['202501']).to.equal(125);
    expect(result['202502']).to.equal(185);
    expect(result['202503']).to.equal(245);
  });

  it('should return NaN for periods with missing data in income or transfer totals', () => {
    const data = {
      periods : ['202501', '202502', '202503', '202504'],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
    };

    const result = cashflowFunction.totalBalances(data, incomeTotal, transferTotal);

    expect(result).to.deep.equal({
      202501  : 125,
      202502  : 185,
      202503  : NaN,
      202504  : NaN,
    });
  });

  it('should handle empty periods array', () => {
    const data = {
      periods : [],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    const result = cashflowFunction.totalBalances(data, incomeTotal, transferTotal);

    expect(result).to.deep.equal({});
  });

  it('should return NaN if any of the totals (income or transfer) is missing for a period', () => {
    const data = {
      periods : ['202501', '202502', '202503'],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
    };

    const result = cashflowFunction.totalBalances(data, incomeTotal, transferTotal);

    expect(result).to.deep.equal({
      202501  : 125,
      202502  : 185,
      202503  : NaN,
    });
  });
});
