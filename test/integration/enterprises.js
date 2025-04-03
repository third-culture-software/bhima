/* global expect, agent */
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const fixtures = path.resolve(__dirname, '../fixtures');

/*
 * The /enterprises API
 * This test suite implements full CRUD on the /enterprises API.
 */
describe('test/integration/enterprises Enterprises API', () => {
  const defaultEnterpriseId = 1;

  const enterprise = {
    name : 'enterprises',
    abbr : 'T.E.S.T',
    email : 'enterprises@test.org',
    po_box : 'enterprises',
    phone : '2016',
    location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
    logo : null,
    currency_id : 2,
  };

  const updateEnterprise = {
    name : 'updateEnterprises',
    abbr : 'upd',
    phone : '00904940950932016',
    location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
    currency_id : 1,
    settings : {
      enable_price_lock : 0,
      enable_barcodes : 1,
      base_index_growth_rate : 5,
      posting_payroll_cost_center_mode : 'default',
    },
  };

  const updateDefaultEnterprise = {
    settings : { enable_barcodes : 0 },
  };

  const invalidEnterprise = {
    name : null,
    abbr : null,
    email : 'enterprises@test.org',
    po_box : 'enterprises',
    phone : '2016',
    location_id : null,
    logo : null,
    currency_id : null,
  };

  /*  the number of enterprises registered in the test db */
  const numEnterprises = 2;

  /* Set the default value of enableBarcode (see schema.sql) */
  const defaultEnableBarcodes = 1;

  /* response keys from a detailed query */
  const responseKeys = [
    'id', 'name', 'abbr', 'email', 'po_box', 'helpdesk', 'phone',
    'location_id', 'logo', 'currency_id', 'gain_account_id', 'loss_account_id',
    'settings', 'address',
  ];

  it('POST /enterprises will register a valid enterprises', () => {
    return agent.post('/enterprises')
      .send({ enterprise })
      .then(res => {
        helpers.api.created(res);
        enterprise.id = res.body.id;
        return agent.get(`/enterprises/${res.body.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /enterprises will not register an incomplete enterprise', () => {
    return agent.post('/enterprises')
      .send({ enterprise : invalidEnterprise })
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('PUT /enterprises/:id should update an existing enterprises', () => {
    return agent.put(`/enterprises/${enterprise.id}`)
      .send(updateEnterprise)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises/:id returns Default Enterprise and check default value for enable_barcode', () => {
    return agent.get(`/enterprises/${defaultEnterpriseId}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body.settings.enable_barcodes)
          .to.equal(defaultEnableBarcodes);
      })
      .catch(helpers.handler);
  });

  it('PUT /enterprises/:id should update Default enterprise', () => {
    return agent.put(`/enterprises/${defaultEnterpriseId}`)
      .send(updateDefaultEnterprise)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        // Check if the update is successful
        expect(res.body.settings.enable_barcodes)
          .to.equal(updateDefaultEnterprise.settings.enable_barcodes);

        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises returns a list of enterprises', () => {
    return agent.get('/enterprises')
      .then(res => {
        helpers.api.listed(res, numEnterprises);
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises?detailed=1 returns a enterprises list with all keys', () => {
    return agent.get('/enterprises')
      .query({ detailed : 1 })
      .then(res => {
        helpers.api.listed(res, numEnterprises);
        expect(res.body[0]).to.have.all.keys([...responseKeys, 'dhis2_uid']);
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises/:id returns a single enterprise', () => {
    return agent.get(`/enterprises/${enterprise.id}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises/:id returns a 404 error for unknown enterprises', () => {
    return agent.get('/enterprises/123456789')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises/:id returns a 404 error it the enterprises id is a string', () => {
    return agent.get('/enterprises/str')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('POST /enterprises/:id/logo should upload a new enterprise logo', () => {
    return agent
      .post(`/enterprises/${enterprise.id}/logo`)

      // NOTE: the documentation for chai-http is wrong when it comes to multer.
      // You must use fs.createReadStream() to attach files as a multipart type
      // that multer can detect.
      .attach('logo', fs.createReadStream(`${fixtures}/logo.ico`))
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('logo');
      })
      .catch(helpers.api.handler);
  });
});
