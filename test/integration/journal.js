/* eslint no-unused-expressions:off */
/* global expect, agent */
const helpers = require('./helpers');

/*
 * The /journal API
 */
describe('test/integration/journal Journal Basic API', () => {
  const RECORD_UUID = 'A5A5F950-A4C9-47F0-9A9A-2BFC3123E534';
  const MISSING_RECORD_UUID = 'A5A5F950-A4C9-47F0-9A9A-2BFC3123E635';

  const NUM_ROW_ALL_RECORDS = 55;
  const NUM_ROWS_FETCHING_TRANSACTION = 4;

  it('GET /journal returns a set of records', () => agent.get('/journal')
    .then((res) => {
      helpers.api.listed(res, NUM_ROW_ALL_RECORDS);
    })
    .catch(helpers.handler));

  it('GET /journal/:record_uuid returns an object with the transaction and aggregate information', () => {
    return agent.get(`/journal/${RECORD_UUID}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.length(NUM_ROWS_FETCHING_TRANSACTION);
      })
      .catch(helpers.handler);
  });

  it('GET /journal/:record_uuid : it returns an error message and 404 code if the transaction does not exist ', () => {
    return agent.get(`/journal/${MISSING_RECORD_UUID}`)
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

});

describe('test/integration/journal Journal Search API', () => {

  const description = 'Sample voucher data one';
  const accountId = 187;
  const amount = 100;
  const DISTINCT_TRANSACTIONS = 22;

  it(`GET /journal?description=${description} should match two records`, () => {
    const NUM_MATCHES = 2;
    return agent.get('/journal')
      .query({ description })
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.handler);
  });

  it('GET /journal filters should be additive', () => {
    const NUM_MATCHES = 1;
    return agent.get('/journal')
      .query({ description, account_id : accountId })
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.handler);
  });

  it(`GET /journal?account_id=${accountId} should find items by account`, () => {
    const NUM_MATCHES = 1;
    return agent.get('/journal')
      .query({ account_id : accountId })
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.handler);
  });

  it(`GET /journal?account_id=${accountId}&showFullTransaction=1 should find complete transactions`, () => {
    const NUM_MATCHES = 2;
    const NUM_TXNS = 1;
    return agent.get('/journal')
      .query({ account_id : accountId, showFullTransactions : 1 })
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);

        // make sure that even though we return more rows, the transactions are unique.
        const uniqueTransactions = res.body
          .map(row => row.record_uuid)
          .filter((record, idx, arr) => arr.indexOf(record) === idx);

        expect(uniqueTransactions).to.have.length(NUM_TXNS);
      })
      .catch(helpers.handler);
  });

  it(`GET /journal?amount=${amount} should return lines with debit or credit equivalent amounts`, () => {
    const NUM_MATCHES = 4;
    return agent.get('/journal')
      .query({ amount })
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.handler);
  });

  it('GET /journal/count returns return the numbers of transactions from Journal', () => {
    return agent.get('/journal/count')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body[0].number_transactions).to.equal(DISTINCT_TRANSACTIONS);
      })
      .catch(helpers.handler);
  });

});

describe('test/integration/journal Journal Corrections API', () => {

  const REVERSE_UUID = 'A5A5F950A4C947F09A9A2BFC3123E534';
  const CORRECT_UUID = '19B4D28CCBB311E8BF7E7F323238856C';

  const reversal = {
    description : 'Reversal for testing purposes.',
  };

  it(`POST /journal/${REVERSE_UUID}/reverse should reverse the transaction`, () => {
    return agent.post(`/journal/${REVERSE_UUID}/reverse`)
      .send(reversal)
      .then(res => {
        helpers.api.created(res);

        expect(res.body.voucher).to.be.an('object');

        return agent.get(`/vouchers/${res.body.uuid}`);
      })
      .then(res => {
        // check that the reversal voucher has been made
        expect(res).to.have.status(200);
        expect(res.body.description).to.include(reversal.description);
        return agent.get(`/vouchers/${REVERSE_UUID}`);
      })
      .then(res => {
        // check that the original voucher has been marked as reversed
        expect(res).to.have.status(200);
        expect(res.body.reversed).to.equal(1);
      })
      .catch(helpers.handler);
  });

  // Correct "TPA8 / Fourth Voucher"
  const transactionDetails = {
    record_uuid : '19B4D28CCBB311E8BF7E7F323238856C',
    user_id : 1,
    project_id : 1,
    currency_id : 1,
    trans_id : 'TPA8',
    transaction_type_id : 5,
    description : 'Transaction reversed using Administrative Voucher Tools TPA8',
    correctionDescription : '(CORRECTION) Transaction reversed using Administrative Voucher Tools TPA8',
  };

  const correction = [{
    account_id : 201,
    credit : 0,
    debit : 100,
    description : 'Fourth Voucher to be Posted',
    entity_uuid : null,
    reference_uuid : null,
  }, {
    account_id : 188,
    credit : 100,
    debit : 0,
    description : 'Fourth Voucher to be Posted',
    entity_uuid : null,
    reference_uuid : null,
  }];

  it(`POST /journal/${CORRECT_UUID}/correct should correct the transaction`, () => {
    return agent.post(`/journal/${CORRECT_UUID}/correct`)
      .send({ transactionDetails, correction })
      .then(res => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.keys('actions', 'details');

        expect(res.body.actions).to.be.an('object');
        expect(res.body.actions).to.have.keys('reversal', 'correction');

        expect(res.body.details).to.be.an('object');
        expect(res.body.details).to.have.keys('reversal', 'correction');
        expect(res.body.details.reversal.description).to.equal(
          '(CORRECTION) Transaction reversed using Administrative Voucher Tools TPA8',
        );

        return agent.get(`/vouchers/${CORRECT_UUID}`);
      })
      .then(res => {
        // check that the original voucher has been marked as reversed
        expect(res).to.have.status(200);
        expect(res.body.reversed).to.equal(1);
      })
      .catch(helpers.handler);
  });

});
