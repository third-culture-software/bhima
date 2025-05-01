const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('totalIncomesPeriods Function', () => {
  it('should calculate the total for each period based on income and transfer totals', () => {
    // Input data for the periods
    const data = {
      periods : ['202501', '202502', '202503'],
    };

    // Sample income total values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample transfer total values for each period
    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Call the totalIncomesPeriods function with the test data
    const result = cashflowFunction.totalIncomesPeriods(data, incomeTotal, transferTotal);

    // Assertions : check that the calculated total is correct for each period
    expect(result['202501']).to.equal(100 + 25); // 125
    expect(result['202502']).to.equal(150 + 35); // 185
    expect(result['202503']).to.equal(200 + 45); // 245
  });

  it('should return NaN for periods with missing data in income or transfer totals', () => {
    // Input data with a missing period
    const data = {
      periods : ['202501', '202502', '202503', '202504'],
    };

    // Sample income total values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample transfer total values for each period
    const transferTotal = {
      202501 : 25,
      202502 : 35,
    };

    // Call the totalIncomesPeriods function with the test data
    const result = cashflowFunction.totalIncomesPeriods(data, incomeTotal, transferTotal);

    // Assertions : check that missing data results in NaN for missing periods
    expect(result['202501']).to.equal(100 + 25); // 125
    expect(result['202502']).to.equal(150 + 35); // 185
    // eslint-disable-next-line no-unused-expressions
    expect(result['202503']).to.be.NaN; // Missing period should result in NaN
    // eslint-disable-next-line no-unused-expressions
    expect(result['202504']).to.be.NaN; // Missing period should result in NaN
  });

  it('should handle empty periods array', () => {
    // Input data with an empty periods array
    const data = {
      periods : [],
    };

    // Sample income total values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample transfer total values for each period
    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Call the totalIncomesPeriods function with the test data
    const result = cashflowFunction.totalIncomesPeriods(data, incomeTotal, transferTotal);

    // Assertions : check that the result is an empty object for an empty periods array
    expect(result).to.deep.equal({});
  });
});
