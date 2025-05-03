const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('sumIncomesPeriods Function', () => {

  it('should calculate the global total of incomes and transfers across all periods', () => {
    // Arrange - Input data
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

    // Act - Call the function
    const result = cashflowFunction.sumIncomesPeriods(data, incomeTotal, transferTotal);

    // Assert - Global total: (100+25) + (150+35) + (200+45) = 555
    expect(result).to.equal(555);
  });

  it('should return NaN for periods with missing data in income or transfer totals', () => {
    // Arrange - Input data with missing data for some periods
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

    // Act - Call the function
    const result = cashflowFunction.sumIncomesPeriods(data, incomeTotal, transferTotal);

    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.NaN;
  });

  it('should handle empty periods array', () => {
    // Arrange - empty periods
    const data = {
      periods : [],
    };

    const incomeTotal = {
      202501 : 100,
      202502 : 150,
    };

    const transferTotal = {
      202501 : 25,
      202502 : 35,
    };

    // Act
    const result = cashflowFunction.sumIncomesPeriods(data, incomeTotal, transferTotal);

    // Assert
    expect(result).to.equal(0);
  });

  it('should return NaN if any of the totals (income or transfer) is missing for a period', () => {
    // Arrange - Input data with a missing total for a period
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

    // Act - Call the function
    const result = cashflowFunction.sumIncomesPeriods(data, incomeTotal, transferTotal);
    // Assert - Expected result : NaN for the missing period (202503) in transferTotal
    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.NaN;
  });
});
