/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /creditors/groups API
 *
 * This test suite implements full CRUD on the /creditors/groups API.
 */
describe('test/integration/creditorGroups Creditor Groups', () => {
  // creditor group we will add during this test suite.
  const creditorGroup = {
    enterprise_id : 1,
    name          : 'Creditor Test',
    account_id    : 284, // 40111000 - SNEL SUPPLIER
    locked        : 0,
  };

  const responseKeys = ['enterprise_id', 'uuid', 'name', 'account_id', 'locked'];
  const numCreditorGroups = 4;

  it('GET /creditors/groups returns a list of creditor group', () => {
    return agent.get('/creditors/groups')
      .then(res => {
        helpers.api.listed(res, numCreditorGroups);
      })
      .catch(helpers.handler);
  });


  it('POST /creditors/groups  should create a new creditor group', () => {
    return agent.post('/creditors/groups')
      .send(creditorGroup)
      .then(res => {
        helpers.api.created(res);
        creditorGroup.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('GET /creditors/groups/:uuid should not be found for unknown uuid', () => {
    return agent.get('/creditors/groups/123456789')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /creditors/groups/:uuid should not be found for invalid uuid', () => {
    return agent.get('/creditors/groups/str')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /creditors/groups  should update an existing creditor group', () => {
    return agent.put(`/creditors/groups/${creditorGroup.uuid}`)
      .send({ name : 'Creditor Group Update' })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(responseKeys);
        expect(res.body.name).to.equal('Creditor Group Update');
      })
      .catch(helpers.handler);
  });

  it('GET /creditors/groups/:uuid returns a single creditor group', () => {
    return agent.get(`/creditors/groups/${creditorGroup.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.uuid).to.equal(creditorGroup.uuid);
      })
      .catch(helpers.handler);
  });
});
