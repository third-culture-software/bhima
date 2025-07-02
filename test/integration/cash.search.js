/* global agent */

/**
 * @overview CashPaymentsSearch
 *
 * @description
 * This file contains tests for the search API on the cash payments server
 * route.  These tests should cover all search possibilities.
 */

const helpers = require('./helpers');

module.exports = CashPaymentsSearch;

function CashPaymentsSearch() {
  const NUM_CASH_RECORDS = 3;
  const DEBTOR_UUID = '3be232f9-a4b9-4af6-984c-5d3f87d5c107';

  let TOMORROW = new Date();
  TOMORROW.setDate(TOMORROW.getDate() + 1);
  [TOMORROW] = TOMORROW.toISOString().split('T');

  // this is a quick querying function to reduce LOC
  const SendHTTPQuery = (parameters, numResults) => {
    return agent.get('/cash/')
      .query(parameters)
      .then((res) => {
        helpers.api.listed(res, numResults);
      })
      .catch(helpers.handler);
  };

  it('GET /cash without parameters returns all cash payments', () => {
    return agent.get('/cash')
      .then((res) => {
        helpers.api.listed(res, NUM_CASH_RECORDS);
      })
      .catch(helpers.handler);
  });

  it('GET /cash filters by description and returns one record', () => {
    return agent.get('/cash')
      .query({ description : 'cool' })
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  // test limit functionality alone
  it('GET /cash?limit=1 returns a single record', () => {
    const params = { limit : 1 };
    return SendHTTPQuery(params, 1);
  });

  it('GET /cash?is_caution=1 returns one record', () => {
    const params = { is_caution : 1 };
    return SendHTTPQuery(params, 1);
  });

  it('GET /cash?is_caution=0 returns two records', () => {
    const params = { is_caution : 0 };
    return SendHTTPQuery(params, 2);
  });

  it('GET /cash?debtor_uuid=? returns 3 records', () => {
    const params = { debtor_uuid : DEBTOR_UUID };
    return SendHTTPQuery(params, 3);
  });

  it('GET /cash?debtor_uuid=?&limit=1 should combine to return a single record', () => {
    const params = { debtor_uuid : DEBTOR_UUID, limit : 1 };
    return SendHTTPQuery(params, 1);
  });

  it('GET /cash?cashbox_id=2 should return one record', () => {
    const params = { cashbox_id : 2 };
    return SendHTTPQuery(params, 1);
  });

  it('GET /cash?reference=CP.TPA.1 should return a single record', () => {
    const params = { reference : 'CP.TPA.1' };
    return SendHTTPQuery(params, 1);
  });

  it('GET /cash?dateFrom=2016-01-01 should return all records', () => {
    const params = { dateFrom : '2016-01-01' };
    return SendHTTPQuery(params, NUM_CASH_RECORDS);
  });

  it(`GET /cash?dateFrom=2016-01-01&dateTo=${TOMORROW} should return all records`, () => {
    const params = { dateFrom : '2016-01-01', dateTo : TOMORROW };
    return SendHTTPQuery(params, NUM_CASH_RECORDS);
  });

  it('GET /cash?user_id=1 should return all records', () => {
    const params = { user_id : 1 };
    return SendHTTPQuery(params, NUM_CASH_RECORDS);
  });

  it('GET /cash?currency_id=1 should return all records', () => {
    const params = { currency_id : 1 };
    return SendHTTPQuery(params, NUM_CASH_RECORDS);
  });
}
