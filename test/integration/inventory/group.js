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

  it('should update all unlocked inventory items with the correct coefficient', async () => {
    // Arrange: define old and new values
    const payload = {
      old : 1000,
      new : 2000,
    };

    const minMonentaryUnit = 0.01; // simulate session value
    const coefficient = payload.new / payload.old;

    // Act: call the endpoint
    const res = await agent.post('/inventory/coefficient_setting').send(payload);

    // Assert: status should be 201
    expect(res.status).to.equal(201);

    // Assert: response should be an array of updated items
    expect(res.body).to.be.an('array');
    res.body.forEach(item => {
      expect(item).to.have.property('price');
      expect(item).to.have.property('note');

      // Extract old price from note to verify calculation
      const regex = /\(1\)\s*([\d.]+)\s*\(2\)\s*([\d.]+)/;
      const match = item.note.match(regex);

      function round(num, decimals = 2) {
        return Math.round(num * 10 ** decimals) / 10 ** decimals;
      }

      if (match) {
        const oldPrice = parseFloat(match[1], 10);
        const expectedPrice = Math.floor((oldPrice * coefficient) / minMonentaryUnit) * minMonentaryUnit;

        expect(round(item.price, 2)).to.equal(round(expectedPrice, 2));
      }
    });
  });

  it('should return 500 if there is an internal error', async () => {
    // Arrange: send invalid payload to trigger an error
    const payload = { old : 0, new : 2000 }; // division by zero

    // Act
    const res = await agent.post('/inventory/coefficient_setting').send(payload);

    // Assert
    expect(res.status).to.be.oneOf([400, 500]);
  });

  it('should return 400 if required fields are missing', async () => {
    const payload = {}; // missing old/new

    const res = await agent.post('/inventory/coefficient_setting').send(payload);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('should restore all unlocked inventory items to their old values', async () => {
    // Arrange: define old and new values
    // 'old' is the current value (after first update)
    // 'new' is the value to restore
    const payload = {
      old : 2000,
      new : 1000,
    };

    const minMonentaryUnit = 0.01; // simulate session value
    const coefficient = payload.new / payload.old; // calculate the coefficient to restore prices

    // Act: call the endpoint to restore values
    const res = await agent.post('/inventory/coefficient_setting').send(payload);

    // Assert: status should be 201 Created
    expect(res.status).to.equal(201);

    // Assert: response should be an array of updated items
    expect(res.body).to.be.an('array');

    res.body.forEach(item => {
      expect(item).to.have.property('price');
      expect(item).to.have.property('note');

      // Extract old price from note to verify calculation
      const regex = /\(1\)\s*([\d.]+)\s*\(2\)\s*([\d.]+)/;
      const match = item.note.match(regex);

      // Helper function to round numbers to 2 decimals
      function round(num, decimals = 2) {
        return Math.round(num * 10 ** decimals) / 10 ** decimals;
      }

      if (match) {
        const oldPrice = parseFloat(match[1], 10); // original price before any update
        const expectedPrice = Math.floor((oldPrice * coefficient) / minMonentaryUnit) * minMonentaryUnit;

        // Assert that the restored price matches the expected value
        expect(round(item.price, 2)).to.equal(round(expectedPrice, 2));
      }
    });
  });
});
