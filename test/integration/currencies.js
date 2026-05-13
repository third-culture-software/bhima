
 

const helpers = require('./helpers');

describe('test/integration/currencies currencies API routes', () => {
  const currencyIdFc = 1;
  const currencyIdEur = 3;
  const keys = [
    'id', 'name', 'note', 'format_key', 'symbol', 'min_monentary_unit',
  ];

  it('GET /currencies should return a list of currencies', () => {
    return agent.get('/currencies')
      .then((res) => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('GET /currencies/:id should return a single currency for Fc', () => {
    return agent.get('/currencies/'.concat(currencyIdFc))
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.keys(keys);
        expect(res.body.name).to.equal('Congolese Francs');
      })
      .catch(helpers.handler);
  });

  it('GET /currencies/:id should return a single currency for EUR', () => {
    return agent.get('/currencies/'.concat(currencyIdEur))
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.keys(keys);
        expect(res.body.name).to.equal('Euro');
      })
      .catch(helpers.handler);
  });
  it('GET /currencies/:id should return an error for unknown id', () => {
    return agent.get('/currencies/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /currencies/:id should return an error for an invalid id', () => {
    return agent.get('/currencies/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
