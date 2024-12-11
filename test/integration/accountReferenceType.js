/* global expect, agent */
const helpers = require('./helpers');

describe('test/integration/accountReferenceType Account Reference Type API', () => {

  const numAccountReferenceType = 8;

  const newAccountReferenceType = {
    label : 'Test Account Reference Type',
  };
  const updateAccountReferenceType = {
    label : 'Update Account Reference Type',
  };

  it('GET /account_reference_type returns all Account Reference Type', () => {
    return agent.get(`/account_reference_type/`)
      .then((res) => {
        helpers.api.listed(res, numAccountReferenceType);
        expect(res.body[0]).to.have.all.keys('id', 'label', 'fixed');
      })
      .catch(helpers.handler);
  });

  it('POST /account_reference_type add Account Reference Type', () => {
    return agent.post('/account_reference_type')
      .send(newAccountReferenceType)
      .then((res) => {
        helpers.api.created(res);
        newAccountReferenceType.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('GET /account_reference_type/:id returns one Account Reference Type as detail', () => {
    return agent.get(`/account_reference_type/${newAccountReferenceType.id}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res).to.be.a('object');
        expect(res.body).to.have.all.keys('id', 'label', 'fixed');
      })
      .catch(helpers.handler);
  });

  it('PUT /account_reference_type/:id updates the newly added Account Reference Type', () => {
    return agent.put(`/account_reference_type/${newAccountReferenceType.id}`)
      .send(updateAccountReferenceType)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        expect(res.body.id).to.equal(newAccountReferenceType.id);
      })
      .catch(helpers.handler);
  });

  it('DELETE /account_reference_type/:id deletes a Account Reference Type', () => {
    return agent.delete(`/account_reference_type/${newAccountReferenceType.id}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/account_reference_type/${newAccountReferenceType.id}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

});
