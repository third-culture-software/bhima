const helpers = require('./helpers');

/*
 * The /supplier API
 *
 * This test suite implements full CRUD on the /supplier API.
 */
describe('test/integration/suppliers The supplier API', () => {

  // supplier we will add during this test suite.
  const supplier = {
    creditor_group_uuid : '8bedb6df-6b08-4dcf-97f7-0cfbb07cf9e2',
    display_name : 'SUPPLIER TEST A',
    address_1 : null,
    address_2 : null,
    fax : null,
    note : null,
    phone : '03949848595',
    international : 0,
    locked : 0,
  };

  const responseKeys = [
    'uuid', 'creditor_uuid', 'display_name', 'address_1', 'address_2',
    'email', 'fax', 'note', 'phone', 'international', 'locked',
    'contact_name', 'contact_email', 'contact_phone', 'contact_title', 'contact_uuid',
    'creditor_group_uuid',
  ];

  const FILTER = {
    display_name : 'UPD',
    limit : 20,
  };

  const NOT_FOUND = {
    display_name : 'TEST',
    limit : 20,
  };

  it('POST /suppliers should create a new supplier ', () => {
    return agent.post('/suppliers')
      .send(supplier)
      .then((res) => {
        helpers.api.created(res);
        supplier.uuid = res.body.uuid;
        return agent.get(`/suppliers/${res.body.uuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.display_name).to.equal(supplier.display_name);
      })
      .catch(helpers.handler);
  });

  it('GET /suppliers returns a list of supplier ', () => {
    return agent.get('/suppliers')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('GET /suppliers/:id will send back a 404 if the suppliers id does not exist', () => {
    return agent.get('/suppliers/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /suppliers/:id will send back a 404 if the suppliers id is a string', () => {
    return agent.get('/suppliers/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /suppliers/?locked=0 returns a complete list of unlocked supplier', () => {
    return agent.get('/suppliers?locked=0')
      .then((res) => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('GET /suppliers?locked=1 returns a complete list of locked supplier', () => {
    return agent.get('/suppliers?locked=1')
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it('PUT /suppliers/:uuid should update an existing supplier', () => {
    return agent.put(`/suppliers/${supplier.uuid}`)
      .send({ display_name : 'SUPPLIER UPDATE' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(responseKeys);
        expect(res.body.display_name).to.equal('SUPPLIER UPDATE');
      })
      .catch(helpers.handler);
  });

  it('GET /suppliers/:uuid returns a single supplier', () => {
    return agent.get(`/suppliers/${supplier.uuid}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      })
      .catch(helpers.handler);
  });

  /*
   * @todo - Theses tests does not actually test anything.  A /search endpoint
   * should always return 200 OK.  A better test will check that content
   * filtering happened.
   *
   * Furthermore, this isn't how you use .send();
   */
  it('GET /suppliers/search filtering the supplier list from the property display_name', () => {
    return agent.get('/suppliers/search')
      .send(FILTER)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      })
      .catch(helpers.handler);
  });

  /* @todo - see above */
  it('GET /suppliers/search the filter returns an empty list because of key words to send to server', () => {
    return agent.get('/suppliers/search')
      .send(NOT_FOUND)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.empty;
      })
      .catch(helpers.handler);
  });
});
