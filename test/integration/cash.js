

const helpers = require('./helpers');

const CashInvoicePayments = require('./cash.invoices');
const CashCautionPayments = require('./cash.cautions');
const CashSearch = require('./cash.search');

describe('test/integration/cash Cash Payments', () => {
  const NUM_CASH_PAYMENTS = 2;
  const TO_DELETE_UUID = '25b69e1d-c9bc-46f2-98a5-5dd948de3636';

  // can't find undefined cash payments
  it('GET /cash/undefined returns an error', () => {
    return agent.get('/cash/undefined')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /cash returns the expected number of payments', () => {
    return agent.get('/cash')
      .then(res => {
        helpers.api.listed(res, NUM_CASH_PAYMENTS);
      })
      .catch(helpers.handler);
  });

  it('DELETE /transactions/:uuid deletes a cash payment', () => {
    return agent.delete(`/transactions/${TO_DELETE_UUID}`)
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/cash/${TO_DELETE_UUID}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  // Tests for the Caution Payment Interface
  describe('Caution Payments ', CashCautionPayments);

  // Tests for the Payment Invoice Payment Interface
  describe('Patient Invoice Payments ', CashInvoicePayments);

  // test for cash search
  describe('Search', CashSearch);
});
