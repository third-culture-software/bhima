/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /exchange API
 */
describe('test/integration/exchange The Exchange API', () => {

  // constants
  const FcRATE = {
    enterprise_id : 1, // Enterprise ID
    currency_id  : 1, // FC in test database
    rate         : 930,
    date         : new Date('2015-10-10'),
  };

  const EuroRATE = {
    enterprise_id : 1, // Enterprise ID
    currency_id  : 3, // Euro in test database
    rate         : 0.84,
    date         : new Date('2021-04-08'),
  };

  const RATE_KEY = [
    'id', 'enterprise_id', 'currency_id', 'enterprise_currency_id', 'rate', 'date',
  ];

  it('GET /exchange returns a list of exchange rates', () => {
    return agent.get('/exchange')
      .then((res) => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('GET /exchange?limit=1 only returns one exchange rate', () => {
    return agent.get('/exchange')
      .query({ limit : 1 })
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('POST /exchange creates a new exchange rate for Fc', () => {
    return agent.post('/exchange')
      .send({ rate : FcRATE })
      .then((res) => {

        // make sure the API conforms to app standards
        helpers.api.created(res);

        FcRATE.id = res.body.id;
        return agent.get('/exchange');
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body[0]).to.not.be.empty;
        expect(res.body[0]).to.contain.keys('currency_id', 'date', 'rate');
      })
      .catch(helpers.handler);
  });

  it('PUT /exchange should update an existing exchange rate for Fc', () => {
    return agent.put(`/exchange/${FcRATE.id}`)
      .send({ rate : 925 })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(RATE_KEY);
        expect(res.body.rate).to.not.equal(FcRATE.rate);
      })
      .catch(helpers.handler);
  });

  it('POST /exchange creates a new exchange rate for Euros', () => {
    return agent.post('/exchange')
      .send({ rate : EuroRATE })
      .then((res) => {

        // make sure the API conforms to app standards
        helpers.api.created(res);

        EuroRATE.id = res.body.id;
        return agent.get('/exchange');
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body[0]).to.not.be.empty;
        expect(res.body[0]).to.contain.keys('currency_id', 'date', 'rate');
      })
      .catch(helpers.handler);
  });

  it('PUT /exchange should update an existing exchange rate for Euros', () => {
    return agent.put(`/exchange/${EuroRATE.id}`)
      .send({ rate : 0.86 })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(RATE_KEY);
        expect(res.body.rate).to.not.equal(EuroRATE.rate);
      })
      .catch(helpers.handler);
  });

  it('GET /exchange returns a list of the updated exchange rates', () => {
    return agent.get('/exchange')
      .then((res) => {
        helpers.api.listed(res, 5);
      })
      .catch(helpers.handler);
  });

  it('GET /exchange/id get updated exchange rate for Euros', () => {
    return agent.get(`/exchange/${EuroRATE.id}`)
      .then((res) => {
        helpers.api.listed(res, 1);
        expect(res.body[0].rate).to.equal(0.86);
      })
      .catch(helpers.handler);
  });

  it('PUT /exchange will send back a 404 if the exchange rate does not exist', () => {
    return agent.put('/exchange/123456789')
      .send({ rate : 1000000 })
      .then((res) => {

        // make sure the API conforms to app standards
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /exchange will send back a 404 if the exchange rate is a string', () => {
    return agent.put('/exchange/str')
      .send({ rate : 1000000 })
      .then((res) => {

        // make sure the API conforms to app standards
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /exchange/:id will send back a 404 if the exchange rate does not exist', () => {
    return agent.delete('/exchange/123456789')
      .then((res) => {

        // make sure the API conforms to app standards
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /exchange/:id will send back a 404 if the exchange rate id is a string', () => {
    return agent.delete('/exchange/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /exchange/:id should delete an exchange rate ', () => {
    return agent.delete(`/exchange/${FcRATE.id}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
