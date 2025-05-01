const { expect } = require('chai');
const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('cashflowFunction.totalOpening', () => {
  it('should correctly calculate total opening balances using provided balance values', () => {
    // Arrange - Input data
    const accountIds = [
      {
        currency_id : 1,
        account_id : 190,
        id : 1,
        label : 'Caisse Principale',
        symbol : 'Fc',
        account_number : 57120010,
        account_label : 'Caisse Principale USD',
      },
      {
        currency_id : 2,
        account_id : 187,
        id : 1,
        label : 'Caisse Principale',
        symbol : '$',
        account_number : 57110010,
        account_label : 'Caisse Principale CDF',
      },
    ];

    const openingBalanceData = [
      {
        debit : '100.00', credit : '50.00', balance : '50.0000', accountId : 190,
      },
      {
        debit : '200.00', credit : '100.00', balance : '100.0000', accountId : 190,
      },
      {
        debit : '300.00', credit : '150.00', balance : '150.0000', accountId : 190,
      },
      {
        debit : '400.00', credit : '200.00', balance : '200.0000', accountId : 190,
      },
      {
        debit : '500.00', credit : '250.00', balance : '250.0000', accountId : 187,
      },
      {
        debit : '600.00', credit : '300.00', balance : '300.0000', accountId : 187,
      },
      {
        debit : '700.00', credit : '350.00', balance : '350.0000', accountId : 187,
      },
      {
        debit : '800.00', credit : '400.00', balance : '400.0000', accountId : 187,
      },
    ];

    const periods = [202501, 202502, 202503, 202504];

    // Act - Call the function
    const result = cashflowFunction.totalOpening(accountIds, openingBalanceData, periods);

    // Assert - Check returned structure
    expect(result).to.have.keys(['tabFormated', 'tabAccountsFormated', 'sumOpening']);

    // Assert - Check tabFormated result
    expect(result.tabFormated).to.deep.equal({
      202501 : 300,
      202502 : 400,
      202503 : 500,
      202504 : 600,
    });

    // Assert - Check tabAccountsFormated result
    expect(result.tabAccountsFormated).to.deep.equal([
      {
        202501 : '50.0000',
        202502 : '100.0000',
        202503 : '150.0000',
        202504 : '200.0000',
        account_label : 'Caisse Principale USD',
        sumOpeningByAccount : 500,
      },
      {
        202501 : '250.0000',
        202502 : '300.0000',
        202503 : '350.0000',
        202504 : '400.0000',
        account_label : 'Caisse Principale CDF',
        sumOpeningByAccount : 1300,
      },
    ]);

    // Assert - Check sumOpening result
    expect(result.sumOpening).to.equal(1800);
  });
});
