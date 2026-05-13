
 

const helpers = require('./helpers');

describe('test/integration/accountsCategories Account Categories API', () => {

  const newAccountCategory = {
    category : 'Test Account Category 1',
  };

  const DELETABLE_ACCOUNT_TYPE_ID = 5;
  const FETCHABLE_ACCOUNT_TYPE_ID = 1;
  const numAccountCategory = 4;

  it('GET /accounts/categories returns a list of account category', () => {
    return agent.get('/accounts/categories/')
      .then((res) => {
        helpers.api.listed(res, numAccountCategory);
      })
      .catch(helpers.handler);
  });

  it('GET /accounts/categories/:id returns one account category', () => {
    return agent.get(`/accounts/categories/${FETCHABLE_ACCOUNT_TYPE_ID}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.id).to.be.equal(FETCHABLE_ACCOUNT_TYPE_ID);
        expect(res.body).to.have.all.keys('id', 'category');
      })
      .catch(helpers.handler);
  });

  it('POST /accounts/categories adds an account category', () => {
    return agent.post('/accounts/categories')
      .send(newAccountCategory)
      .then((res) => {
        helpers.api.created(res);
        newAccountCategory.id = res.body.id;
        return agent.get(`/accounts/categories/${newAccountCategory.id}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys('id', 'category');
      })
      .catch(helpers.handler);
  });

  it('PUT /accounts/categories/:id updates the newly added account category', () => {
    const updateInfo = { category : 'updated category' };
    return agent.put(`/accounts/categories/${newAccountCategory.id}`)
      .send(updateInfo)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.id).to.equal(newAccountCategory.id);
        expect(res.body.type).to.equal(updateInfo.type);
      })
      .catch(helpers.handler);
  });

  it('DELETE /accounts/categories/:id deletes a account type', () => {
    return agent.delete(`/accounts/categories/${DELETABLE_ACCOUNT_TYPE_ID}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/accounts/categories/${DELETABLE_ACCOUNT_TYPE_ID}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

});
