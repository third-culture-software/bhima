const { expect } = require('chai');
const sinon = require('sinon');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');
const AccountsExtra = require('../../../server/controllers/finance/accounts/extra');

describe('cashflowFunction.getOpeningBalanceData', () => {
  it('should return specific balances for each account and period combination', async () => {
    const cashAccountIds = [190, 187];
    const periods = [
      { id : 202501, number : 1, start_date : new Date('2024-12-31') },
      { id : 202502, number : 2, start_date : new Date('2025-01-31') },
      { id : 202503, number : 3, start_date : new Date('2025-02-28') },
      { id : 202504, number : 4, start_date : new Date('2025-03-31') },
    ];

    // Stub of the external function with a dynamic result
    const stub = sinon.stub(AccountsExtra, 'getOpeningBalanceForDate').callsFake((accountId, startDate) => {
      const timestamp = new Date(startDate).getTime();
      return Promise.resolve({
        balance : accountId + (timestamp % 1000),
        credit : (accountId % 100) + 50,
        debit : (accountId % 50) + 25,
        accountId,
      });
    });

    const result = await cashflowFunction.getOpeningBalanceData(cashAccountIds, periods);

    expect(stub.callCount).to.equal(cashAccountIds.length * periods.length);
    expect(result).to.have.length(8);

    result.forEach(entry => {
      expect(entry).to.have.property('balance').that.is.a('number');
      expect(entry).to.have.property('credit').that.is.a('number');
      expect(entry).to.have.property('debit').that.is.a('number');
      expect(entry).to.have.property('accountId').that.is.oneOf(cashAccountIds);
    });

    stub.restore();
  });
});
