/* global inject */
describe('test/client-unit/services/TrialBalanceService', () => {
  let TrialBalance;

  beforeEach(module('bhima.services', 'bhima.mocks', 'angularMoment', 'bhima.constants'));

  beforeEach(inject(TrialBalanceService => {
    TrialBalance = TrialBalanceService;
  }));

  it('#groupByAccountType() returns 0 when types are the same', () => {
    const rows = [
      { debit_equiv : 10, credit_equiv : 0, type_id : 1 },
      { debit_equiv : 0, credit_equiv : 10, type_id : 1 },
    ];

    const grouping = TrialBalance.groupByAccountType(rows);
    expect(grouping).to.deep.equal({ 'ACCOUNT.TYPES.ASSET' : 0 });
  });

  it('#groupByAccountType() returns the correct sums for diverse account types', () => {
    const rows = [
      { debit_equiv : 10, credit_equiv : 0, type_id : 1 },
      { debit_equiv : 0, credit_equiv : 10, type_id : 4 },
      { debit_equiv : 30, credit_equiv : 0, type_id : 2 },
      { debit_equiv : 0, credit_equiv : 15, type_id : 5 },
      { debit_equiv : 0, credit_equiv : 15, type_id : 1 },
      { debit_equiv : 100, credit_equiv : 0, type_id : 5 },
      { debit_equiv : 0, credit_equiv : 100, type_id : 4 },
    ];

    const result = {
      'ACCOUNT.TYPES.ASSET' : -5,
      'ACCOUNT.TYPES.INCOME' : -110,
      'ACCOUNT.TYPES.LIABILITY' : 30,
      'ACCOUNT.TYPES.EXPENSE' : 85,
    };

    const grouping = TrialBalance.groupByAccountType(rows);
    expect(grouping).to.deep.equal(result);
  });
});
