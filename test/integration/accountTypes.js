/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

describe('test/integration/accountTypes Account Types', () => {
  const newAccountType = {
    type : 'Test Account Type 1',
    account_category_id : 1,
  };

  const DELETABLE_ACCOUNT_TYPE_ID = 7;
  const FETCHABLE_ACCOUNT_TYPE_ID = 1;
  const numAccountTypes = 6;

  it('GET /accounts/types returns a list of account type', () => {
    return agent.get('/accounts/types/')
      .then((res) => {
        helpers.api.listed(res, numAccountTypes);
      })
      .catch(helpers.handler);
  });

  it('GET /accounts/types/:id returns one account type', () => {
    return agent.get(`/accounts/types/${FETCHABLE_ACCOUNT_TYPE_ID}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.id).to.be.equal(FETCHABLE_ACCOUNT_TYPE_ID);
        expect(res.body).to.have.all.keys('id', 'type');
      })
      .catch(helpers.handler);
  });

  it('POST /accounts/types adds an account type', () => {
    return agent.post('/accounts/types')
      .send(newAccountType)
      .then((res) => {
        helpers.api.created(res);
        newAccountType.id = res.body.id;
        return agent.get(`/accounts/types/${newAccountType.id}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys('id', 'type');
      })
      .catch(helpers.handler);
  });

  it('PUT /accounts/types/:id updates the newly added account type', () => {
    const updateInfo = { type : 'updated value' };
    return agent.put(`/accounts/types/${newAccountType.id}`)
      .send(updateInfo)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.id).to.equal(newAccountType.id);
        expect(res.body.type).to.equal(updateInfo.type);
      })
      .catch(helpers.handler);
  });

  it('DELETE /accounts/types/:id deletes a account type', () => {
    return agent.delete(`/accounts/types/${DELETABLE_ACCOUNT_TYPE_ID}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/accounts/types/${DELETABLE_ACCOUNT_TYPE_ID}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
