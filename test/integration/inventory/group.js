/* global expect, agent */

const helpers = require('../helpers');
const shared = require('./shared');

describe('test/integration/inventory/groups The inventory groups API', () => {
  const NUM_GROUPS = 34;

  it(`GET /inventory/groups finds ${NUM_GROUPS} inventory groups`, () => {
    return agent.get('/inventory/groups')
      .then(res => {
        helpers.api.listed(res, NUM_GROUPS);
      })
      .catch(helpers.handler);
  });

  it('POST /inventory/groups create a new inventory group', () => {
    return agent.post('/inventory/groups')
      .send(shared.inventoryGroup)
      .then(res => {
        helpers.api.created(res);
        expect(res.body.uuid).to.be.equal(shared.inventoryGroup.uuid);
      })
      .catch(helpers.handler);
  });

  // update inventory group
  it('PUT /inventory/groups/:uuid updates an existing inventory group', () => {
    return agent.put(`/inventory/groups/${shared.inventoryGroup.uuid}`)
      .send(shared.updateGroup)
      .then(res => {
        const group = res.body;
        shared.updateGroup.uuid = shared.inventoryGroup.uuid;
        expect(group).to.contain.all.keys(Object.keys(shared.updateGroup));

        Object.keys(group).forEach(key => {
          expect(group[key]).to.be.equals(shared.updateGroup[key]);
        });
      })
      .catch(helpers.handler);
  });

  it(`GET /inventory/groups finds ${NUM_GROUPS + 1} inventory groups after creation`, () => {
    return agent.get('/inventory/groups')
      .then(res => {
        helpers.api.listed(res, NUM_GROUPS + 1);
      })
      .catch(helpers.handler);
  });

  // details of inventory groups
  it('GET /inventory/groups returns details of an inventory group', () => {
    return agent.get(`/inventory/groups/${shared.inventoryGroup.uuid}`)
      .then(res => {
        const group = res.body;
        expect(group).to.contain.all.keys(Object.keys(shared.inventoryGroup));
        // compare value to the last update of our request
        Object.keys(group).forEach(key => {
          expect(group[key]).to.be.equals(shared.updateGroup[key]);
        });
      })
      .catch(helpers.handler);
  });

  // delete the inventory groups
  it('DELETE /inventroy/groups delete an existing inventory group', () => {
    return agent.delete(`/inventory/groups/${shared.inventoryGroup.id}`)
      .then(res => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
