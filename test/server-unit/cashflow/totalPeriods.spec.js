// server/controllers/finance/reports/cashflow/cashflow.test.js

const { expect } = require('chai');

// Import the function to be tested
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('cashflowFunction.totalPeriods', () => {
  it('should calculate the total for each period based on income, expense, and transfer totals', () => {
    // Arrange - Input data
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
      202502 : 70,
      202503 : 80,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Act - Call the function
    const result = cashflowFunction.totalPeriods(data, incomeTotal, expenseTotal, transferTotal);

    // Assert - Expected result for each period
    // 202501: 100 + 50 + 25 = 175
    // 202502: 150 + 70 + 35 = 255
    // 202503: 200 + 80 + 45 = 325
    expect(result).to.deep.equal({
      202501 : 175,
      202502 : 255,
      202503 : 325,
    });
  });

  it('should return NaN for periods with missing data in income, expense, or transfer totals', () => {
    // Arrange - Input data with missing data for some periods
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
      202502 : 70,
      202503 : 80,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
    };

    // Act - Call the function
    const result = cashflowFunction.totalPeriods(data, incomeTotal, expenseTotal, transferTotal);

    // Assert - Expected result with missing period (202504)
    expect(result).to.deep.equal({
      202501 : 175,
      202502 : 255,
      202503 : NaN, // For 202503, the transfer is missing, so the total is NaN
      202504 : NaN, // Non-existent period in incomeTotal, so NaN
    });
  });

  it('should handle empty periods array', () => {
    // Arrange - Empty periods array
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
      202502 : 70,
      202503 : 80,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Act - Call the function
    const result = cashflowFunction.totalPeriods(data, incomeTotal, expenseTotal, transferTotal);

    // Assert - The result should be an empty object as there are no periods
    expect(result).to.deep.equal({});
  });

  it('should return NaN if any of the totals (income, expense, or transfer) is missing for a period', () => {
    // Arrange - Input data with a missing total for a period
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
      // 202502 missing
      202503 : 80,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
      202503 : 45,
    };

    // Act - Call the function
    const result = cashflowFunction.totalPeriods(data, incomeTotal, expenseTotal, transferTotal);

    // Assert - Expected result: NaN for the missing period (202502) in expenseTotal
    expect(result).to.deep.equal({
      202501 : 175,
      202502 : NaN, // Period 202502 with a missing total for expenses
      202503 : 325,
    });
  });
});
