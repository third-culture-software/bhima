const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('sumTotalIncomes Function', () => {
  it('should calculate the total income for all periods based on income, other, and opening totals', () => {
    // Sample data with periods
    const data = {
      periods : ['202501', '202502', '202503'],
    };

    // Sample income total values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample other total values for each period
    const otherTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Sample opening total values for each period
    const opening = {
      202501 : 50,
      202502 : 60,
      202503 : 70,
    };

    // Call the sumTotalIncomes function with the test data
    const result = cashflowFunction.sumTotalIncomes(data, incomeTotal, otherTotal, opening);

    // Assertions : check that the total sum is correctly calculated
    // Sum for period 202501 = 100 + 25 + 50 = 175
    // Sum for period 202502 = 150 + 35 + 60 = 245
    // Sum for period 202503 = 200 + 45 + 70 = 315
    // Total = 175 + 245 + 315 = 735
    expect(result).to.equal(735);
  });

  it('should handle missing data for periods in incomeTotal, otherTotal, or opening', () => {
    // Input data with a missing period in one of the totals
    const data = {
      periods : ['202501', '202502', '202503', '202504'],
    };

    // Sample income total values for each period
    const incomeTotal = {
      202501 : 100,
      202502 : 150,
      202503 : 200,
    };

    // Sample other total values for each period
    const otherTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Sample opening values for each period
    const opening = {
      202501 : 50,
      202502 : 60,
      // Missing period 202503 data for opening
    };

    // Call the sumTotalIncomes function with the test data
    const result = cashflowFunction.sumTotalIncomes(data, incomeTotal, otherTotal, opening);

    // Assertions : check that missing data results in NaN for the missing period
    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.NaN;
  });

  it('should return 0 if the periods array is empty', () => {
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

    // Sample other total values for each period
    const otherTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Sample opening values for each period
    const opening = {
      202501 : 50,
      202502 : 60,
      202503 : 70,
    };

    // Call the sumTotalIncomes function with the test data
    const result = cashflowFunction.sumTotalIncomes(data, incomeTotal, otherTotal, opening);

    // Assertions : check that the result is 0 for an empty periods array
    expect(result).to.equal(0);
  });
});
