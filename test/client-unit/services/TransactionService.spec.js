/* global inject */
/* eslint no-unused-expressions:off */
describe('test/client-unit/services/TransactionService', () => {

  beforeEach(module('angularMoment', 'bhima.services', 'ui.bootstrap', 'bhima.constants'));

  let Transactions;
  beforeEach(inject(TransactionService => {
    Transactions = TransactionService;
  }));

  const dataset = [{
    uuid : 'EBA5959FE0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 343,
    debit : 20,
    credit : 0,
    debit_equiv : 20,
    credit_equiv : 0,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    account_number : 66121011,
  }, {
    uuid : 'EBA59D5CE0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 343,
    debit : 10,
    credit : 0,
    debit_equiv : 10,
    credit_equiv : 0,
    currency_id : 2,
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 66121011,
  }, {
    uuid : 'EBA5A422E0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 358,
    debit : 20,
    credit : 0,
    debit_equiv : 20,
    credit_equiv : 0,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 61411010,
  }, {
    uuid : 'EBA5A94EE0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 343,
    debit : 20,
    credit : 0,
    debit_equiv : 20,
    credit_equiv : 0,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 66121011,
  }, {
    uuid : 'EBA5ADADE0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 220,
    debit : 500,
    credit : 0,
    debit_equiv : 500,
    credit_equiv : 0,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 66110011,
  }, {
    uuid : 'EBA5B1E7E0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 179,
    debit : 0,
    credit : 730,
    debit_equiv : 0,
    credit_equiv : 730,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : '42D3756A77704BB8A8997953CD859892',
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 42210010,
  }, {
    uuid : 'EBA5B62BE0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018d',
    account_id : 350,
    debit : 150,
    credit : 0,
    debit_equiv : 150,
    credit_equiv : 0,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 66311010,
  }, {
    uuid : 'EBA5BA57E0F711E8808D000C296B3772',
    project_id : 1,
    fiscal_year_id : 4,
    period_id : 201811,
    trans_id : 'TPA18',
    trans_date : '2018-11-05T12:40:05.000Z',
    record_uuid : 'F905A9479A2C4BB781F2D84740AD25EB',
    hrRecord : 'VO.TPA.7',
    description : 'ENGAGEMENT DE PAIE [02-2018]/ Février 2018',
    account_id : 347,
    debit : 10,
    credit : 0,
    debit_equiv : 10,
    credit_equiv : 0,
    currency_id : 2,
    currencyName : 'United States Dollars',
    entity_uuid : null,
    reference_uuid : null,
    transaction_type_id : 15,
    user_id : 1,
    abbr : 'TPA',
    project_name : 'Test Project A',
    account_number : 66161010,
  }];

  it('#offlineValidation() should return false if everything is valid', () => {
    const rows = angular.copy(dataset);

    const isInvalid = Transactions.offlineValidation(rows);
    expect(isInvalid).to.be.false;
  });

  it('#offlineValidation() should error if there is a single line in the transaction', () => {
    const rows = angular.copy(dataset);
    const [row] = rows;

    const message = Transactions.offlineValidation([row]);
    expect(message).to.equal('TRANSACTIONS.SINGLE_ROW_TRANSACTION');
  });

  it('#offlineValidation() should error if only one account is used', () => {
    const rows = angular.copy(dataset);
    rows.forEach(row => { row.account_id = 1313; });

    const message = Transactions.offlineValidation(rows);
    expect(message).to.equal('TRANSACTIONS.SINGLE_ACCOUNT_TRANSACTION');
  });

  it('#offlineValidation() should error if there is not a transaction type per row', () => {
    const rows = angular.copy(dataset);
    rows.forEach(row => { delete row.transaction_type_id; });

    const message = Transactions.offlineValidation(rows);
    expect(message).to.equal('TRANSACTIONS.MISSING_TRANSACTION_TYPE');
  });

  it('#offlineValidation() should error if the transaction contains negative numbers', () => {
    const rows = angular.copy(dataset);
    rows.forEach(row => { row.debit *= -1; });

    const message = Transactions.offlineValidation(rows);
    expect(message).to.equal('VOUCHERS.COMPLEX.ERROR_NEGATIVE_NUMBERS');
  });

  it('#offlineValidation() should error if both debits and credits contain values', () => {
    const rows = angular.copy(dataset);

    rows[0].debit = 15;
    rows[0].credit = 12;

    const message = Transactions.offlineValidation(rows);
    expect(message).to.equal('VOUCHERS.COMPLEX.ERROR_AMOUNT');
  });

  it('#offlineValidation() should error for an unbalanced transaction', () => {
    const rows = angular.copy(dataset);

    rows.forEach(row => { row.debit = 1; row.credit = 0; });
    rows[0].credit = 150000;
    rows[0].debit = 0;

    const message = Transactions.offlineValidation(rows);
    expect(message).to.equal('TRANSACTIONS.IMBALANCED_TRANSACTION');
  });

});
