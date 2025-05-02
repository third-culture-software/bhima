const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('aggregateTotalByTextKeys Function', () => {

  it('should aggregate totals by periods and calculate sumAggregate', () => {
    const data = { periods : ['202501', '202502', '202503'] };
    const source = {
      key1 : [
        { 202501 : 10, 202502 : 20, 202503 : 30 }, { 202501 : 5, 202502 : 10, 202503 : 15 },
      ],
      key2 : [
        { 202501 : 7, 202502 : 14, 202503 : 21 }, { 202501 : 3, 202502 : 6, 202503 : 9 },
      ],
    };

    const result = cashflowFunction.aggregateTotalByTextKeys(data, source);

    expect(result.key1['202501']).to.equal(15);
    expect(result.key1['202502']).to.equal(30);
    expect(result.key1['202503']).to.equal(45);
    expect(result.key1.sumAggregate).to.equal(90);

    expect(result.key2['202501']).to.equal(10);
    expect(result.key2['202502']).to.equal(20);
    expect(result.key2['202503']).to.equal(30);
    expect(result.key2.sumAggregate).to.equal(60);
  });

  it('should handle empty transactions correctly', () => {
    const data = { periods : ['202501', '202502', '202503'] };
    const source = {
      key1 : [],
      key2 : [],
    };

    const result = cashflowFunction.aggregateTotalByTextKeys(data, source);

    expect(result.key1['202501']).to.equal(0);
    expect(result.key1['202502']).to.equal(0);
    expect(result.key1['202503']).to.equal(0);
    expect(result.key1.sumAggregate).to.equal(0);

    expect(result.key2['202501']).to.equal(0);
    expect(result.key2['202502']).to.equal(0);
    expect(result.key2['202503']).to.equal(0);
    expect(result.key2.sumAggregate).to.equal(0);
  });

  it('should return 0 for missing periods in transactions', () => {
    const data = { periods : ['202501', '202502', '202503'] };
    const source = {
      key1 : [{ 202501 : 10 }, { 202502 : 20 }],
    };

    const result = cashflowFunction.aggregateTotalByTextKeys(data, source);

    expect(result.key1['202501']).to.equal(10);
    expect(result.key1['202502']).to.equal(20);
    expect(result.key1['202503']).to.equal(0);
    expect(result.key1.sumAggregate).to.equal(30);
  });

  it('should handle extra periods in data without error', () => {
    const data = { periods : ['202501', '202502', '202503', '202504'] };
    const source = {
      key1 : [{ 202501 : 10, 202502 : 20, 202503 : 30 }],
    };

    const result = cashflowFunction.aggregateTotalByTextKeys(data, source);

    expect(result.key1['202501']).to.equal(10);
    expect(result.key1['202502']).to.equal(20);
    expect(result.key1['202503']).to.equal(30);
    expect(result.key1['202504']).to.equal(0);
    expect(result.key1.sumAggregate).to.equal(60);
  });
});
