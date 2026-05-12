/* global expect, agent */

const helpers = require('../helpers');
const shared = require('./shared');
const xlsx = require('../../../server/lib/renderers/xlsx');

describe('test/integration/inventory/metadata The inventory metadata API', () => {
  let inventoryList;

  // inventory list items
  const metadata = {
    code : '1000012', // code must be unique
    text : '[IT] Inventory Article',
    price : 5,
    default_quantity : 15,
    group_uuid : shared.inventoryGroup.uuid,
    unit_id : 1,
    type_id : 1,
    consumable : 0,
    sellable : 1,
    importance : 2,
    is_asset : 1,
    manufacturer_brand : 'BHIMA',
    manufacturer_model : '2.X',
  };

  const inventoryUuid = 'f6556e72-9d05-4799-8cbd-0a03b1810185';

  const metadataUpdate = {
    code : '1000012', // code must be unique
    text : '[IT] Inventory Article updated',
    default_quantity : 12,
    group_uuid : shared.inventoryGroup.uuid,
    consumable : 0,
    manufacturer_brand : 'HTML',
    manufacturer_model : '2.',
  };

  const metadataSearch = {
    text : 'Albendazo', // should find "Albendazole"
  };

  it('GET /inventory/download/log/?lang=fr downloads the log in MS Excel format', () => {
    return agent.get(`/inventory/download/log/${inventoryUuid}?lang=fr`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.be.equal(xlsx.headers['Content-Type']);
      })
      .catch(helpers.handler);
  });

  it('POST /inventory/metadata create a new inventory metadata', () => {
    return agent.post('/inventory/metadata')
      .send(metadata)
      .then(res => {
        helpers.api.created(res);
        metadata.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('PUT /inventory/metadata/:uuid update an existing inventory metadata', () => {
    return agent.put(`/inventory/metadata/${metadata.uuid}`)
      .send(metadataUpdate)
      .then(res => {
        // NOTE: Returned data are from the /inventory/:uuid/metadata API
        // these data are not sent by the test but come from join with other table :
        // label, groupName, type, unit
        expect(res.body.code).to.be.equal(metadataUpdate.code);
        expect(res.body.label).to.be.equal(metadataUpdate.text);
        expect(res.body.default_quantity).to.be.equal(metadataUpdate.default_quantity);
        expect(res.body.group_uuid).to.be.equal(metadataUpdate.group_uuid);
        expect(res.body.consumable).to.be.equal(metadataUpdate.consumable);
        expect(res.body.manufacturer_brand).to.be.equal(metadataUpdate.manufacturer_brand);
        expect(res.body.manufacturer_model).to.be.equal(metadataUpdate.manufacturer_model);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata returns the list of filtered inventories', () => {
    return agent.get('/inventory/metadata')
      .query(metadataSearch)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        inventoryList = res.body;
        expect(res.body.length).to.be.equal(3);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata returns the list of inventory metadata', () => {
    return agent.get('/inventory/metadata')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        inventoryList = res.body;
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the sellable column', () => {
    return agent.get('/inventory/metadata')
      .query({ sellable : 1 })
      .then(res => {
        helpers.api.listed(res, 2332);
        return agent.get('/inventory/metadata')
          .query({ sellable : 0 });
      })
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the importance column', () => {
    let allItemCounted;
    return agent.get('/inventory/metadata')
      .then(res => {
        allItemCounted = res.body.length;
        return agent.get('/inventory/metadata')
          .query({ importance : 2 });
      })
      .then(res => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        expect(item.importance).to.equal(2);
        return agent.get('/inventory/metadata')
          .query({ importance : null });
      })
      .then(res => {
        helpers.api.listed(res, allItemCounted - 1);
        const items = res.body;
        const allItemsHaveNullImportance = items.every(item => item.importance === null);
        expect(allItemsHaveNullImportance).to.equal(true);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the price column', () => {
    return agent.get('/inventory/metadata')
      .query({ price : 1.10 })
      .then(res => {
        helpers.api.listed(res, 3);
        return agent.get('/inventory/metadata')
          .query({ price : 8.72 });
      })
      .then(res => {
        helpers.api.listed(res, 5);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the code column', () => {
    return agent.get('/inventory/metadata')
      .query({ code : 'DARV_STAV4C6_0' })
      .then(res => {
        helpers.api.listed(res, 1);
        const [item] = res.body;

        expect(item.label).to.equal('Stavudine (d4T), 40mg, Caps, 60, Vrac');
        expect(item.price).to.equal(4.9500);

        return agent.get('/inventory/metadata')
          .query({ code : 'DEXT_HALO1A-_0' });
      })
      .then(res => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        expect(item.label).to.equal('Halothane, 250ml, flacon, Unité');
        expect(item.price).to.equal(3.0700);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the consumable column', () => {
    return agent.get('/inventory/metadata')
      .query({ consumable : 0 })
      .then(res => {
        helpers.api.listed(res, 2);
        return agent.get('/inventory/metadata')
          .query({ consumable : 1 });
      })
      .then(res => {
        helpers.api.listed(res, 2333);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the locked column', () => {
    return agent.get('/inventory/metadata')
      .query({ locked : 0 })
      .then(res => {
        helpers.api.listed(res, 2333);
        return agent.get('/inventory/metadata')
          .query({ locked : 1 });
      })
      .then(res => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('GET /inventory/metadata filters on the group_uuid column', () => {
    const groupUuid = 'D81D12F0727C11EA8241000C2997DDC0';
    const numGroupMembers = 49;

    return agent.get('/inventory/metadata')
      .query({ group_uuid : shared.inventoryGroup.uuid })
      .then(res => {
        helpers.api.listed(res, 1);
        return agent.get('/inventory/metadata')
          .query({ group_uuid : groupUuid });
      })
      .then(res => {
        helpers.api.listed(res, numGroupMembers);
      })
      .catch(helpers.handler);
  });

  // count inventory in the group
  it('GET /inventory/groups/:uuid/count', () => {
    return agent.get(`/inventory/groups/${shared.inventoryGroup.uuid}/count`)
      .then(res => {
        const countInventory = inventoryList.filter((item) => {
          return item.group_uuid === shared.inventoryGroup.uuid;
        }).length;
        expect(res.body).to.be.equal(countInventory);
      })
      .catch(helpers.handler);
  });

  const quinineUuid = helpers.data.QUININE;
  const tenofovirUuid = 'a8dede6c-7b16-11ea-a7a2-d39be13abbf6';
  const quinineInventoryPrice = 6.63;
  const quininePreviousPrice = 200;
  it('GET /inventory/metadata?use_previous_price=1 uses previous purchase price', () => {
    let oldQuinine;
    let oldTenofovir;
    return agent.get('/inventory/metadata')
      .query({ use_previous_price : 0 })
      .then(res => {
        oldQuinine = res.body.filter(i => i.uuid === quinineUuid).pop();
        oldTenofovir = res.body.filter(i => i.uuid === tenofovirUuid).pop();

        return agent.get('/inventory/metadata')
          .query({ use_previous_price : 1 });
      })
      .then(res => {
        const newQuinine = res.body.filter(i => i.uuid === quinineUuid).pop();
        const newTenofovir = res.body.filter(i => i.uuid === tenofovirUuid).pop();

        expect(oldQuinine.uuid).to.equal(newQuinine.uuid);
        expect(oldQuinine.code).to.equal(newQuinine.code);
        expect(oldQuinine.price).to.equal(newQuinine.price);
        expect(oldQuinine.price).to.equal(quinineInventoryPrice);
        expect(newQuinine.price).to.not.equal(quininePreviousPrice);

        // price should be unchanged for items not bought
        expect(oldTenofovir.price).to.equal(newTenofovir.price);
      })
      .catch(helpers.handler);
  });
});
