

const helpers = require('../helpers');
const shared = require('./shared');

describe('test/integration/inventory/types The inventory types API', () => {
  const NUM_TYPES = 3;

  it(`GET /inventory/types finds ${NUM_TYPES} inventory types`, () => {
    return agent.get('/inventory/types')
      .then(res => {
        helpers.api.listed(res, NUM_TYPES);
      })
      .catch(helpers.handler);
  });

  // create inventory type
  it('POST /inventory/types create a new inventory types', () => {
    return agent.post('/inventory/types')
      .send(shared.inventoryType)
      .then(res => {
        shared.inventoryType.id = res.body.id;
        helpers.api.created(res);
        expect(res.body.id).to.be.equal(shared.inventoryType.id);
      })
      .catch(helpers.handler);
  });

  // update inventory type
  it('PUT /inventory/types/:id updates an existing inventory type', () => {
    return agent.put(`/inventory/types/${shared.inventoryType.id}`)
      .send(shared.updateInventoryType)
      .then(res => {
        const type = res.body[0];
        shared.updateInventoryType.id = shared.inventoryType.id;
        expect(type).to.contain.all.keys(Object.keys(shared.updateInventoryType));
        expect(type).to.be.deep.equals(shared.updateInventoryType);
      })
      .catch(helpers.handler);
  });

  // details of inventory types
  it('GET /inventory/types returns details of an inventory type', () => {
    return agent.get(`/inventory/types/${shared.inventoryType.id}`)
      .then(res => {
        const type = res.body[0];
        expect(type).to.contain.all.keys(Object.keys(shared.inventoryType));
        expect(type).to.be.deep.equals(shared.updateInventoryType);
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it(`GET /inventory/types finds ${NUM_TYPES + 1} inventory types after creation`, () => {
    return agent.get('/inventory/types')
      .then(res => {
        helpers.api.listed(res, NUM_TYPES + 1);
      })
      .catch(helpers.handler);

  });

  // delete the inventory types
  it('DELETE /inventroy/types delete an existing inventory types', () => {
    return agent.delete(`/inventory/types/${shared.inventoryType.id}`)
      .then(res => {
        helpers.api.deleted(res);
        return agent.get('/inventory/types');
      })
      .then(res => {
        helpers.api.listed(res, NUM_TYPES);
      })
      .catch(helpers.handler);
  });
});
