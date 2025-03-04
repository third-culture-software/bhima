/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('../../helpers');

const target = '/reports/finance/account_report';

describe(`test/integration${target} Report Account`, () => {

  const parameters = {
    account_id : 171, // 41111000 - SNEL
    dateFrom : '2016-01-01',
    dateTo : '2016-12-31',
    currency_id : 1,
  };

  const clone = (object) => JSON.parse(JSON.stringify(object));

  it(`GET ${target} should return HTML data for HTML rendering target`, () => {
    const copy = clone(parameters);
    copy.renderer = 'html';

    return agent.get(target)
      .query(copy)
      .then(res => {
        expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        expect(res.text).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  it(`GET ${target} should return PDF data for PDF rendering target`, function pdf() {
    this.timeout(10000);
    const copy = clone(parameters);
    copy.renderer = 'pdf';

    return agent.get(target)
      .query(copy)
      .then(res => {
        expect(res.headers['content-type']).to.equal('application/pdf');
        expect(res.type).to.equal('application/pdf');
      })
      .catch(helpers.handler);
  });

});
