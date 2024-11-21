/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/* The /cashboxes API */
describe('test/integration/cashboxes The Cashboxes API', () => {
  const numCashboxes = 2;
  const numAuxCashboxes = 1;
  const NUMBER_OF_CASHBOX_CURRENCIES = 2;
  const numCashboxCurrencies = 4;

  // new cashbox
  const BOX = {
    label : 'New Test Cashbox C',
    project_id : helpers.data.PROJECT,
    is_auxiliary : 1,
  };

  // new cashbox account currency
  const BOX_CURRENCY = {
    currency_id : 1,
    account_id : 190, // 57120010 - Caisse Principale USD
    transfer_account_id : 194, // 58511010 - Virement des fonds Caisse Auxiliaire - Caisse Principale USD
  };

  it('GET /cashboxes returns a list of cashboxes', () => {
    return agent.get('/cashboxes')
      .then(res => {
        helpers.api.listed(res, numCashboxes);
        expect(res.body[0]).to.contain.keys('id', 'label');
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes?is_auxiliary=1 returns only auxiliary cashboxes', () => {
    return agent.get('/cashboxes?is_auxiliary=1')
      .then(res => {
        helpers.api.listed(res, numAuxCashboxes);
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes?detailed=1 returns a list of cashboxes with expanded properties', () => {
    return agent.get('/cashboxes?detailed=1')
      .then(res => {
        helpers.api.listed(res, numCashboxCurrencies);
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes/:id should return a single cashbox with currencies', () => {
    return agent.get('/cashboxes/1')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body).to.contain.keys('currencies', 'id', 'label');
        expect(res.body.currencies).to.have.length(NUMBER_OF_CASHBOX_CURRENCIES);
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes/:id should return a 404 for invalid cashbox', () => {
    return agent.get('/cashboxes/invalid')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('POST /cashboxes should create a new cashbox', () => {
    return agent.post('/cashboxes')
      .send({ cashbox : BOX })
      .then(res => {
        helpers.api.created(res);
        BOX.id = res.body.id;
        return agent.get(`/cashboxes/${BOX.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal(BOX.label);
        expect(res.body.is_auxiliary).to.equal(BOX.is_auxiliary);
      })
      .catch(helpers.handler);
  });

  it('PUT /cashboxes/:id should update the cashbox', () => {
    return agent.put(`/cashboxes/${BOX.id}`)
      .send({ is_auxiliary : 0 })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body.label).to.equal(BOX.label);
        expect(res.body.is_auxiliary).to.equal(0);
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes/:id/currencies should return an empty list of cashbox currencies', () => {
    return agent.get(`/cashboxes/${BOX.id}/currencies`)
      .then(res => {
        helpers.api.listed(res, 0);
      });
  });

  it('POST /cashboxes/:id/currencies should create a new currency account', () => {
    return agent.post(`/cashboxes/${BOX.id}/currencies`)
      .send(BOX_CURRENCY)
      .then(res => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes/:id/currencies/:currencyId should return a single cashbox currency reference', () => {
    return agent.get(`/cashboxes/${BOX.id}/currencies/${BOX_CURRENCY.currency_id}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).not.to.be.empty;
        expect(res.body.account_id).to.equal(BOX_CURRENCY.account_id);
        expect(res.body.transfer_account_id).to.equal(BOX_CURRENCY.transfer_account_id);
      });
  });

  it('GET /cashboxes/:id/currencies/unknown should return a single cashbox currency reference', () => {
    return agent.get(`/cashboxes/${BOX.id}/currencies/unknown`)
      .then(res => {
        helpers.api.errored(res, 404);
      });
  });


  it('PUT /cashboxes/:id/currencies/:currencyId should update a new currency account', () => {
    return agent.put(`/cashboxes/${BOX.id}/currencies/${BOX_CURRENCY.currency_id}`)
      .send({ transfer_account_id : 197 })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.account_id).to.equal(BOX_CURRENCY.account_id);
      })
      .catch(helpers.handler);
  });

  // why does this route exit?! Why should this not fail?
  // see https://github.com/Third-Culture-Software/bhima/commit/3b943808be5d59579db95edfd2e0bb4482fac07c
  // server/controllers/finance/cashboxes/currencies.js lines 132-136
  it('PUT /cashboxes/:id/currencies/<undefined currency> should successfully return nothing', () => {
    return agent.put(`/cashboxes/${BOX.id}/currencies/123456789`)
      .send({ transfer_account_id : 197 })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.empty;
      })
      .catch(helpers.handler);
  });

  it('PUT /cashboxes/:id/currencies/<invalid value> should successfully return nothing', () => {
    return agent.put(`/cashboxes/${BOX.id}/currencies/str`)
      .send({ transfer_account_id : 197 })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.empty;
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes/:id/users should return users subscribed to a cashbox', () => {
    // details on the test cashbox as found in the dataset built before integration tests
    const testDataCashbox = {
      id : 1,
      numberOfUsers : 2,
    };
    return agent.get(`/cashboxes/${testDataCashbox.id}/users`)
      .then(result => {
        helpers.api.listed(result, testDataCashbox.numberOfUsers);

        // results should look like users
        expect(result.body[0]).to.have.keys('id', 'username', 'display_name', 'deactivated', 'last_login');
      });
  });

  it('DELETE /cashboxes/:id should delete the cashbox and associated currencies', () => {
    return agent.delete(`/cashboxes/${BOX.id}`)
      .then(res => {
        helpers.api.deleted(res);
        return agent.get(`/cashboxes/${BOX.id}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cashboxes/:id should return a 404 for an unknown cashbox id', () => {
    return agent.delete('/cashboxes/123456789')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cashboxes/:id should return a 404 it the cashbox id is a string', () => {
    return agent.delete('/cashboxes/str')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /cashboxes privileges for the current User On Each Auxiliary Cashboxes', () => {
    return agent.get('/cashboxes/privileges')
      .then(res => {
        helpers.api.listed(res, numAuxCashboxes);
        expect(res.body[0]).to.contain.keys('id', 'label', 'project_id', 'is_auxiliary', 'user_id');
      })
      .catch(helpers.handler);
  });
});
