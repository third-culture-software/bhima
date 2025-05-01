const { expect } = require('chai');
const sinon = require('sinon');

// Import the database module to mock it
const db = require('../../../server/lib/db');

const cashflowFunction = require('../../../server/controllers/finance/reports/cashflow/cashflow.function');

describe('Cashflow Function - getCashboxesDetails', () => {
  let dbExecStub;

  // Setup a stub before each test
  beforeEach(() => {
    dbExecStub = sinon.stub(db, 'exec');
  });

  // Restore original behavior after each test
  afterEach(() => {
    sinon.restore();
  });

  it('should return cashbox details for given cashbox IDs', async () => {
    // Arrange
    const cashboxesIds = ['1']; // Input parameter
    const fakeResult = [
      {
        currency_id : 1,
        account_id : 2,
        id : 1,
        label : 'Main Cashbox',
        symbol : '$',
        account_number : '1000',
        account_label : 'Main Account',
      },
    ];

    // Mock db.exec to return the fake result
    dbExecStub.resolves(fakeResult);

    // Act
    const result = await cashflowFunction.getCashboxesDetails(cashboxesIds);

    // Assert
    // eslint-disable-next-line no-unused-expressions
    expect(dbExecStub.calledOnce).to.be.true;
    expect(dbExecStub.firstCall.args[0]).to.include('SELECT'); // Check if the query was sent
    expect(result).to.deep.equal(fakeResult);
  });
});
