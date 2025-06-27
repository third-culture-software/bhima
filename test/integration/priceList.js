/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /prices API
 */
describe('test/integration/priceList Price List', () => {
  // constants
  const emptyPriceList = {
    uuid : 'DA4BE62A4310408897A457C14CAB49C8',
    label : 'Test Empty Price List',
    description : 'A price list without items attached yet.',
  };

  const priceListItems = [{
    inventory_uuid : helpers.data.QUININE,
    label : 'Test $11 reduction on an item',
    is_percentage : false,
    value : 10,
  }, {
    inventory_uuid : helpers.data.MULTIVITAMINE,
    label : 'Test 13% reduction on an item',
    is_percentage : true,
    value : 12,
  }];

  const floatPriceListItems = [
    {
      inventory_uuid : helpers.data.PREDNISONE,
      label : 'float item value',
      is_percentage : false,
      value : 3.14,
    },
  ];

  const priceListItems2 = [{
    inventory_uuid : helpers.data.MULTIVITAMINE,
    label : 'Test $10 reduction on an item',
    is_percentage : false,
    value : 10,
  }, {
    inventory_uuid : helpers.data.PARACETEMOL,
    label : 'Test 25% reduction on an item',
    is_percentage : true,
    value : 12,
  }];

  const priceListItemsWithDuplicates = [{
    inventory_uuid : helpers.data.QUININE,
    label : 'Duplicate Label',
    is_percentage : false,
    value : 10,
  }, {
    inventory_uuid : helpers.data.PREDNISONE,
    label : 'Duplicate Label',
    is_percentage : false,
    value : 10,
  }];

  const complexPriceList = {
    label : 'Test Price List w/ Two Items',
    description : 'A price list with two items attached.',
    items : priceListItems,
  };

  const invalidPriceList = {
    label : 'An invalid price list',
    items : [
      {
        inventory_uuid : null,
        label : 'You cannot have a null inventory uuid, if you were wondering...',
        is_percentage : false,
        value : 1.2,
      },
    ],
  };

  const somePriceListWithFloatValues = {
    label : 'Test Price List w/ Floats',
    description : 'A price list with float values',
    items : floatPriceListItems,
  };

  const duplicatesPriceList = {
    uuid : helpers.uuid(),
    label : 'This list contains duplicate labels',
    description : 'The list has a tone of items.',
    items : priceListItemsWithDuplicates,
  };

  const responseKeys = [
    'uuid', 'label', 'description', 'created_at', 'updated_at', 'items',
  ];

  it('GET /prices returns only one default record', () => {
    return agent.get('/prices')
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('GET /prices/unknown Id returns a 404 error', () => {
    return agent.get('/prices/unknownId')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('POST /prices should create a price list (without price list items)', () => {
    return agent.post('/prices')
      .send({ list : emptyPriceList })
      .then(res => {
        helpers.api.created(res);

        // attach the returned id
        emptyPriceList.uuid = res.body.uuid;
        return agent.get(`/prices/${emptyPriceList.uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
        return agent.get('/prices').query({ detailed : 1 });
      })
      .then(res => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('PUT /prices should update the (empty) price list\'s label', () => {
    const newLabel = 'Test Empty Price List (updated)';
    return agent.put(`/prices/${emptyPriceList.uuid}`)
      .send({ list : { label : newLabel } })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.all.keys(responseKeys);
        expect(res.body.label).to.equal(newLabel);
        expect(res.body.items).to.be.empty;
      })
      .catch(helpers.handler);
  });

  it('PUT /prices should update the (empty) price list with price list items', () => {
    return agent.put(`/prices/${emptyPriceList.uuid}`)
      .send({ list : { items : priceListItems2 } })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /prices should return a list of two items', () => {
    return agent.get('/prices')
      .then(res => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('POST /prices should create a price list with two items', () => {
    return agent.post('/prices')
      .send({ list : complexPriceList })
      .then(res => {
        helpers.api.created(res);
        complexPriceList.uuid = res.body.uuid;
        return agent.get(`/prices/${complexPriceList.uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /prices should return a list of three items', () => {
    return agent.get('/prices')
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('POST /prices with an invalid price list item should not create a dangling price list', () => {
    return agent.post('/prices')
      .send({ list : invalidPriceList })
      .then(res => {
        helpers.api.errored(res, 400);

        expect(res.body.code).to.equal('ERRORS.ER_BAD_NULL_ERROR');

        // make sure we didn't gain a price list!
        return agent.get('/prices');
      })
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('POST /prices with items with duplicate labels should be allowed.', () => {
    return agent.post('/prices')
      .send({ list : duplicatesPriceList })
      .then(res => {
        helpers.api.created(res);
        duplicatesPriceList.uuid = res.body.uuid;
        return agent.get(`/prices/${duplicatesPriceList.uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('POST /price will register a float as a price list item', () => {
    return agent.post('/prices')
      .send({ list : somePriceListWithFloatValues })
      .then(res => {
        // assert that the records was successfully created
        helpers.api.created(res);

        // look up the record to make sure the price list's value is actually a float
        return agent.get('/prices/'.concat(res.body.uuid));
      })
      .then(res => {
        // ... do some checks ...
        expect(res.body.items[0].value).to.equal(3.14);
      })
      .catch(helpers.handler);
  });

  it('DELETE /prices/unknownid should return a 404 error.', () => {
    return agent.delete('/prices/unknownid')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /prices/:uuid should delete an existing price list', () => {
    return agent.delete(`/prices/${emptyPriceList.uuid}`)
      .then(res => {
        expect(res).to.have.status(204);
        return agent.get(`/prices/${emptyPriceList.uuid}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
