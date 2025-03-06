/* global expect, agent */

const helpers = require('./helpers');

describe('test/integration/debtors The /debtors API', () => {
  const debtorKeys = ['uuid', 'group_uuid', 'text'];
  const debtorUuid = '3BE232F9A4B94AF6984C5D3F87D5C107';
  const emptyDebtorUuid = 'A11E6B7FFBBB432EAC2A5312A66DCCF4';

  const debtorInfo = {
    group_uuid : '4DE0FE47177F4D30B95FCFF8166400B4',
    text : 'Patient/2/Patient',
  };

  it('GET /debtors/:uuid/invoices returns a list of all invoices of a given debtor', () => {
    return agent.get(`/debtors/${debtorUuid}/invoices`)
      .then((res) => {
        helpers.api.listed(res, 5);
      })
      .catch(helpers.handler);
  });

  it('GET /debtors/:uuid/invoices?balanced=0 returns a list of unbalanced invoices of a given debtor', () => {
    return agent.get(`/debtors/${debtorUuid}/invoices?balanced=0`)
      .then((res) => {
        helpers.api.listed(res, 4);
      })
      .catch(helpers.handler);
  });

  it('GET /debtors/:uuid/invoices?balanced=1 returns a list of balanced invoices of a given debtor', () => {
    return agent.get(`/debtors/${debtorUuid}/invoices?balanced=1`)
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('GET /debtors/:uuid/invoice should return an empty list if the debtor does not have any invoices', () => {
    return agent.get(`/debtors/${emptyDebtorUuid}/invoices`)
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it('GET /debtors should return a list of all debtors', () => {
    return agent.get('/debtors')
      .then((res) => {
        helpers.api.listed(res, 261);
      })
      .catch(helpers.handler);
  });

  // FIXME - incredibly hard coded!!
  it('GET /debtors/:uuid should return detail of a specifying debtor', () => {
    return agent.get(`/debtors/${debtorUuid}`)
      .then((res) => {
        expect(res.body).to.contain.all.keys(debtorKeys);
        expect(res.body.uuid).to.be.equal(debtorUuid);
        expect(res.body.group_uuid).to.be.equal(debtorInfo.group_uuid);
        expect(res.body.text).to.be.equal(debtorInfo.text);
      })
      .catch(helpers.handler);
  });
});
