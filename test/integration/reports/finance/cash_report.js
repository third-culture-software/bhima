

const RenderingTests = require('../rendering');

const target = '/reports/finance/cash_report';
const helpers = require('../../helpers');

describe(`test/integration${target} Cash Report`, () => {
  const keys = [
    'account', 'cashbox', 'footer', 'dateFrom', 'dateTo', 'hasUnpostedRecords', 'header',
    'metadata', 'transactions',
  ];

  const parameters = {
    dateFrom : '2016-01-01',
    dateTo : '2016-12-31',
    type : 1,
    account_id : 187, // 57110010 - Caisse Principale CDF
    format : 2,
  };

  describe('Cash Report', RenderingTests(target, null, parameters));

  it(`GET ${target} returns the correct JSON keys`, () => {
    parameters.renderer = 'json';
    return agent.get(target)
      .query(parameters)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;  
        expect(res.body).to.contain.all.keys(keys);
      })
      .catch(helpers.handler);
  });
});
