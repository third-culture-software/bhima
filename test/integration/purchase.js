const moment = require('moment');
const helpers = require('./helpers');

const puid = helpers.uuid();

/*
 * The /purchases API
 * This test suite implements full CRUD on the /purchases API.
 */
describe('test/integration/purchases Purchases API', () => {
  const datePurchaseFormat1 = moment().subtract(1725, 'days').toDate();
  const datePurchaseFormat2 = moment().subtract(1665, 'days').toDate();
  const datePurchaseFormat3 = moment().subtract(1543, 'days').toDate();
  const datePurchaseFormat4 = moment().subtract(1512, 'days').toDate();
  const datePurchaseFormat5 = moment().subtract(1421, 'days').toDate();
  const datePurchaseFormat6 = moment().subtract(1542, 'days').toDate();

  // purchase order we will add during this test suite
  const purchaseOrder = {
    uuid : puid,
    cost          : 546.7520,
    date          : new Date(datePurchaseFormat1),
    currency_id   : 1,
    supplier_uuid : '3ac4e83c-65f2-45a1-8357-8b025003d793',
    project_id    : 1,
    user_id       : 2,
    status_id     : 1,
    items         : [{
      inventory_uuid : helpers.data.QUININE,
      quantity       : 200,
      unit_price     : 0.0538,
      total          : 10.7520,
      package_size   : 1,
    }, {
      inventory_uuid : helpers.data.PREDNISONE,
      quantity       : 16000,
      unit_price     : 0.0335,
      total          : 536.0000,
      package_size   : 1,
    }],
  };

  const purchaseOrder2 = {
    cost          : 536.0000,
    date          : new Date(datePurchaseFormat2),
    currency_id   : 1,
    supplier_uuid : '3ac4e83c-65f2-45a1-8357-8b025003d793',
    project_id    : 1,
    user_id       : 2,
    status_id     : 2,
    items         : [{
      inventory_uuid : helpers.data.PREDNISONE,
      quantity       : 16000,
      unit_price     : 0.0335,
      total          : 536.0000,
      package_size   : 1,
    }],
  };

  const purchaseOrder3 = {
    cost          : 10.7520,
    date          : new Date(datePurchaseFormat3),
    currency_id   : 1,
    supplier_uuid : '3ac4e83c-65f2-45a1-8357-8b025003d793',
    project_id    : 1,
    user_id       : 2,
    status_id     : 2,
    items         : [{
      inventory_uuid : helpers.data.QUININE,
      quantity       : 200,
      unit_price     : 0.0538,
      total          : 10.7520,
      package_size   : 1,
    }],
  };

  const purchaseOrder4 = {
    cost          : 546.7520,
    date          : new Date(datePurchaseFormat4),
    currency_id   : 1,
    supplier_uuid : '3ac4e83c-65f2-45a1-8357-8b025003d793',
    project_id    : 1,
    user_id       : 2,
    status_id     : 2,
    items         : [{
      inventory_uuid : helpers.data.QUININE,
      quantity       : 200,
      unit_price     : 0.0538,
      total          : 10.7520,
      package_size   : 1,
    }, {
      inventory_uuid : helpers.data.PREDNISONE,
      quantity       : 16000,
      unit_price     : 0.0335,
      total          : 536.0000,
      package_size   : 1,
    }],
  };

  const purchaseOrder5 = {
    cost          : 546.7520,
    date          : new Date(datePurchaseFormat5),
    currency_id   : 1,
    supplier_uuid : '3ac4e83c-65f2-45a1-8357-8b025003d793',
    project_id    : 1,
    user_id       : 2,
    status_id     : 2,
    items         : [{
      inventory_uuid : helpers.data.QUININE,
      quantity       : 200,
      unit_price     : 0.0538,
      total          : 10.7520,
      package_size   : 1,
    }, {
      inventory_uuid : helpers.data.PREDNISONE,
      quantity       : 16000,
      unit_price     : 0.0335,
      total          : 536.0000,
      package_size   : 1,
    }],
  };

  const responseKeys = [
    'uuid', 'reference', 'cost', 'date', 'supplier', 'user_id', 'supplier_uuid', 'note',
    'status_id',
  ];

  it('POST /purchases should create a new purchase order', () => {
    return agent.post('/purchases')
      .send(purchaseOrder)
      .then((res) => {
        helpers.api.created(res);
        purchaseOrder.uuid = res.body.uuid;
        return agent.get(`/purchases/${purchaseOrder.uuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.cost).to.equal(purchaseOrder.cost);
      })
      .catch(helpers.handler);
  });

  it('POST /purchases returns 400 for an invalid purchase order', () => {
    return agent.post('/purchases')
      .send({})
      .then(res => helpers.api.errored(res, 400))
      .catch(helpers.handler);
  });

  it('GET /purchases/:uuid should return a single JSON purchase order', () => {
    return agent.get(`/purchases/${purchaseOrder.uuid}`)
      .then((res) => {
        const purchase = res.body;
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(purchase.uuid).to.exist;
      })
      .catch(helpers.handler);
  });

  it('GET /purchases?detailed=1 returns a complete list of purchase', () => {
    return agent.get('/purchases')
      .query({ detailed : 1 })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body[0]).to.contain.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /purchases/:uuid will send back a 404 if the purchases id does not exist', () => {
    return agent.get('/purchases/123456789')
      .then(res => helpers.api.errored(res, 404))
      .catch(helpers.handler);
  });

  it('GET /purchases/:uuid will send back a 404 if the purchases id is a string', () => {
    return agent.get('/purchases/str')
      .then(res => helpers.api.errored(res, 404))
      .catch(helpers.handler);
  });

  it('PUT /purchases/:uuid unable to update an unknown purchase order', () => {
    return agent.put('/purchases/invalid')
      .send({ note : 'This was canceled a week ago' })
      .then(res => helpers.api.errored(res, 404))
      .catch(helpers.handler);
  });

  it('GET /purchases?inventory_uuid=X returns purchases by inventory_uuid', () => {
    return agent.get('/purchases')
      .query({ inventory_uuid : helpers.data.QUININE })
      .then((res) => {
        helpers.api.listed(res, 2);

        return agent.get('/purchases')
          .query({ inventory_uuid : helpers.data.PREDNISONE });
      })
      .then((res) => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  // Integration test to test the calculation of the average command interval
  it('POST /purchases create confirmed purchase order 2', () => {
    return agent.post('/purchases')
      .send(purchaseOrder2)
      .then((res) => { helpers.api.created(res); })
      .catch(helpers.handler);
  });

  it('POST /purchases create confirmed purchase order 3', () => {
    return agent.post('/purchases')
      .send(purchaseOrder3)
      .then((res) => {
        helpers.api.created(res);
        purchaseOrder3.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /purchases create confirmed purchase order 4', () => {
    return agent.post('/purchases')
      .send(purchaseOrder4)
      .then((res) => { helpers.api.created(res); })
      .catch(helpers.handler);
  });

  it('POST /purchases create confirmed purchase order 5', () => {
    return agent.post('/purchases')
      .send(purchaseOrder5)
      .then((res) => { helpers.api.created(res); })
      .catch(helpers.handler);
  });

  it(`GET /inventory/metadata/:uuid
    Checking the calculation of the order interval for inventory: ${helpers.data.QUININE_TEXT}`, () => {
    return agent.get(`/inventory/metadata/${helpers.data.QUININE}`)
      .then(res => {
        expect(res.body.purchase_interval).to.be.equal(2);
        expect(res.body.num_purchase).to.be.equal(3);
      })
      .catch(helpers.handler);
  });

  it(`GET /inventory/metadata/:uuid
    Checking the calculation of the order interval for inventory: ${helpers.data.PREDNISONE_TEXT}`, () => {
    return agent.get(`/inventory/metadata/${helpers.data.PREDNISONE}`)
      .then(res => {
        expect(res.body.purchase_interval).to.be.equal(3.7700);
        expect(res.body.num_purchase).to.be.equal(4);
      })
      .catch(helpers.handler);
  });

  it('PUT /purchases/:uuid cannot change a purchase order not awaiting confirmation', () => {
    const changes = { ...purchaseOrder3, status_id : 1, date : new Date(datePurchaseFormat6) };
    return agent.put(`/purchases/${purchaseOrder3.uuid}`)
      .send(changes)
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  // TODO(@jniles) - should we allow modification of non-awaiting-confirmation purchase orders?
  // if not, then this is kind of irrelevant.
  it.skip(`GET /inventory/metadata/:uuid
    Checking the calculation of the order interval for inventory
    After Updating status:: ${helpers.data.QUININE_TEXT}`, () => {
    return agent.get(`/inventory/metadata/${helpers.data.QUININE}`)
      .then(res => {
        expect(res.body.purchase_interval).to.be.equal(2);
        expect(res.body.num_purchase).to.be.equal(2);
      })
      .catch(helpers.handler);
  });

  // tests modification of a non-confirmed purchase order
  it('PUT /purchases/:uuid allows modification of non-confirmed purchase orders', async () => {
    const before = (await agent.get(`/purchases/${puid}`)).body;

    const note = 'Test of note modification.  I\'ve been modified!';

    await agent.put(`/purchases/${puid}`)
      .send({ note });

    const after = (await agent.get(`/purchases/${puid}`)).body;

    // check that the update when through.
    expect(after.note).not.to.equal(before.note);
    expect(after.note).to.equal(note);

    // remove the notes
    delete before.note;
    delete after.note;

    // everything else should be identical
    expect(before).to.deep.equal(after);
  });

  it('PUT /purchases/:uuid modifies items of non-confirmed purchase orders', async () => {
    const purchase = (await agent.get(`/purchases/${puid}`)).body;

    // make new items, preserving the old values
    const items = purchase.items.map(item => ({
      uuid : item.uuid,
      quantity : 10,
      unit_price : 15,
      total : 10 * 15,
    }));

    // reset items
    purchase.items = items;

    // update the purchase order
    await agent.put(`/purchases/${purchase.uuid}`)
      .send({ items });

    const after = (await agent.get(`/purchases/${puid}`)).body;

    const hasCorrectPrices = after.items.every(item => item.unit_price === 15);
    expect(hasCorrectPrices).to.equal(true);
    const hasCorrectQuantities = after.items.every(item => item.quantity === 10);
    expect(hasCorrectQuantities).to.equal(true);
  });

  context('Purchases Search API', () => {
    const NUM_PURCHASE_ORDERS = 7;

    // this is a quick querying function to reduce LOC
    const SendHTTPQuery = (parameters, numResults) => {
      return agent.get('/purchases/search')
        .query(parameters)
        .then((res) => {
          helpers.api.listed(res, numResults);
        })
        .catch(helpers.handler);
    };

    it('GET /purchases/search returns all purchase orders', () => {
      return SendHTTPQuery({}, NUM_PURCHASE_ORDERS);
    });

    // TODO - implement limit query
    it('GET /purchases/search?limit=1 returns a single purchase order', () => {
      const options = { limit : 1 };
      return SendHTTPQuery(options, 1);
    });

    it('GET /purchases/search?dateFrom={date} returns a single purchase order from today', () => {
      const date = new Date('2016-02-19');
      const options = { dateFrom : date };
      return SendHTTPQuery(options, NUM_PURCHASE_ORDERS);
    });

    it('GET /purchases/search?reference=PO.TPA.1  returns a single purchase order', () => {
      const options = { reference : 'PO.TPA.1' };
      return SendHTTPQuery(options, 1);
    });
  });

  context('Purchases Deletion API', () => {

    it('DELETE /purchases/:uuid removes a purchase order', () => {
      return agent.delete(`/purchases/${puid}`)
        .then(res => {
          expect(res).to.have.status(201);
        })
        .catch(helpers.handler);
    });

    it('DELETE /purchases/:uuid should return 404 if the purchase order does not exist', () => {
      return agent.delete(`/purchases/${puid}`)
        .then(res => {
          helpers.api.errored(res, 404);
        })
        .catch(helpers.handler);
    });
  });

});
