/* eslint no-unused-expressions:off */
/* global expect, agent */
const helpers = require('./helpers');

/*
 * The /trial_balance API
 */
describe('test/integration/trialbalance The /journal/trialbalance API', () => {
  const GOOD_TXNS = ['a5a5f950-a4c9-47f0-9a9a-2bfc3123e534']; // TPA1
  const EMPTY_TXNS = [];
  const ERROR_TXNS = ['3688e9ce-85ea-4b5c-9144-688177edcb63']; // TRANS5
  const POSTING_TXNS = [
    'a5a5f950-a4c9-47f0-9a9a-2bfc3123e534', // TPA1
    '2e1332b7-3e63-411e-827d-42ad585ff517',
    'f24619e0-3a88-4784-a750-a414fc9567bf',
    '19b4d28c-cbb3-11e8-bf7e-7f323238856c', // fourth voucher
  ];

  const formatParams = transactions => ({ transactions });

  it('POST /journal/trialbalance handles empty select with a 400 error', () => {
    return agent.post('/journal/trialbalance')
      .send(formatParams(EMPTY_TXNS))
      .then((res) => {
        helpers.api.errored(res, 400, 'POSTING_JOURNAL.ERRORS.MISSING_TRANSACTIONS');
      })
      .catch(helpers.handler);
  });

  it.skip('POST /journal/trialbalance returns an object with errors and summary information', () => {
    return agent.post('/journal/trialbalance')
      .send(formatParams(ERROR_TXNS))
      .then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;

        // assert that the returned object has errors and summary properties
        expect(res.body).to.have.keys(['errors', 'summary']);

        // make sure that TRANS5 sends back an incorrect date error
        const err = res.body.errors[0];
        expect(err.code).to.equal('POSTING_JOURNAL.ERRORS.DATE_IN_WRONG_PERIOD');
      })
      .catch(helpers.handler);
  });

  it('POST /journal/trialbalance returns summary information grouped by account', () => {
    return agent.post('/journal/trialbalance')
      .send(formatParams(GOOD_TXNS))
      .then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;

        // assert that the returned object has errors and summary properties
        expect(res.body).to.have.keys(['errors', 'summary']);

        // the errors property should be empty
        expect(res.body.errors).to.have.length(0);

        // The transactions TPA1, TPA10 hit 2 accounts and should have the following profiles
        const { summary } = res.body;

        expect(summary).to.have.length(2);

        // all accounts have 0 balance before
        expect(summary[0].balance_before).to.equal(0);
        expect(summary[1].balance_before).to.equal(0);

        expect(summary[0].debit_equiv).to.equal(0);
        expect(summary[1].debit_equiv).to.equal(100);

        expect(summary[0].credit_equiv).to.equal(100);
        expect(summary[1].credit_equiv).to.equal(0);

        expect(summary[0].balance_final).to.equal(-100);
        expect(summary[1].balance_final).to.equal(100);
      })
      .catch(helpers.handler);
  });

  it('POST /journal/transactions posts the a transaction to general_ledger and removes it from the journal', () => {
    return agent.post('/journal/transactions')
      .send(formatParams(POSTING_TXNS))
      .then((res) => {
        expect(res).to.have.status(201);
        return agent.get(`/journal/${POSTING_TXNS[0]}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;

        const isPosted = res.body[0].posted;
        expect(isPosted).to.equal(1);
      })
      .catch(helpers.handler);
  });
});
