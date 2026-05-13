const { describe, it }= require('node:test');
const assert = require('node:assert/strict');

const { aggregateData }= require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('cashflowFunction.aggregateData', () => {
  it('should correctly aggregate values by period and compute total sumAggregate', () => {
    // Arrange - Input data
    const inputData = {
      'Clients and Other Debtor Groups' : {
        202501 : 10,
        202502 : 20,
        202503 : 30,
        202504 : 101.0752,
        sumAggregate : 161.0752,
      },
      'Medical Activities' : {
        202501 : 100,
        202502 : 200,
        202503 : 300,
        202504 : 26012,
        sumAggregate : 26612,
      },
    };

    // Act - Call the function
    const result = aggregateData(inputData);

    assert.ok(result, 'Result should not be null or undefined');
    assert.deepEqual(result, {
    // Assert - Expected result
      202501 : 110,
      202502 : 220,
      202503 : 330,
      202504 : 26113.0752,
      sumAggregate : 26773.0752,
    });
  });
});
