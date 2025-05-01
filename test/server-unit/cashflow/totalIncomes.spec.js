const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('totalIncomes Function', () => {
  it('should calculate the total for each period based on income, other totals, and opening values', () => {
    // Input data for the periods
    const data = {
      periods : ['202501', '202502', '202503'],
    };

    // Sample total income values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample other totals for each period
    const otherTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Sample opening values for each period
    const opening = {
      202501 : 10,
      202502 : 20,
      202503 : 30,
    };

    // Call the totalIncomes function with the test data
    const result = cashflowFunction.totalIncomes(data, incomeTotal, otherTotal, opening);

    // Assertions : check that the calculated total is correct for each period
    expect(result['202501']).to.equal(100 + 25 + 10); // 135
    expect(result['202502']).to.equal(150 + 35 + 20); // 205
    expect(result['202503']).to.equal(200 + 45 + 30); // 275
  });

  it('should return NaN for periods with missing data in income, other total, or opening', () => {
    // Input data with a missing period
    const data = {
      periods : ['202501', '202502', '202503', '202504'],
    };

    // Sample total income values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample other totals for each period
    const otherTotal = {
      202501 : 25,
      202502 : 35,
    };

    // Sample opening values for each period
    const opening = {
      202501 : 10,
      202502 : 20,
      202503 : 30,
    };

    // Call the totalIncomes function with the test data
    const result = cashflowFunction.totalIncomes(data, incomeTotal, otherTotal, opening);

    expect(result['202501']).to.equal(135);
    expect(result['202502']).to.equal(205);

    // eslint-disable-next-line no-unused-expressions
    expect(result['202503']).to.be.NaN;

    // eslint-disable-next-line no-unused-expressions
    expect(result['202504']).to.be.NaN;
  });

  it('should handle empty periods array', () => {
    // Input data with an empty periods array
    const data = {
      periods : [],
    };

    // Sample total income values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample other totals for each period
    const otherTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Sample opening values for each period
    const opening = {
      202501 : 10,
      202502 : 20,
      202503 : 30,
    };

    // Call the totalIncomes function with the test data
    const result = cashflowFunction.totalIncomes(data, incomeTotal, otherTotal, opening);

    // Assertions : check that the result is an empty object for an empty periods array
    expect(result).to.deep.equal({});
  });
});
