const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('cashflowFunction.aggregateTotal', () => {
  it('should aggregate values from multiple items into a single total per period', () => {
    // Arrange - Input data
    const data = {
      periods : [202501, 202502, 202503],
    };

    const source = {
      item1 : {
        202501 : 100,
        202502 : 150,
        202503 : 200,
      },
      item2 : {
        202501 : 50,
        202502 : 70,
        202503 : 80,
      },
      item3 : {
        202501 : 10,
        202502 : 20,
        202503 : 30,
      },
    };

    // Act - Call the function
    const result = cashflowFunction.aggregateTotal(data, source);

    // Assert - Expected result
    expect(result).to.deep.equal({
      202501 : 160, // 100 + 50 + 10
      202502 : 240, // 150 + 70 + 20
      202503 : 310, // 200 + 80 + 30
    });
  });
});
