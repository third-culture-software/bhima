

const { it } = require('mocha');
const helpers = require('./helpers');

/*
 * The /cost_center  API
 *
 * This test suite implements full CRUD on the /cost_center_allocation_basis_quantity API.
 */  
describe('test/integration/costCenterAllocationQuantity Cost center step-down allocation basis quantity API', () => {

  const quantity1 = {
    basis_id : 2,
    cost_center_id : 4,
    quantity : 2.1,
  };

  const quantity2 = {
    basis_id : 1,
    cost_center_id : 5,
    quantity : 3.4,
  };

  const update1 = {
    quantity : 5.1,
  };

  it('GET /cost_center_allocation_basis_quantity returns a list of allocation basis quantity items', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it('POST /cost_center_allocation_basis_quantity should create a new allocation basis quantity item', () => {
    return agent.post('/cost_center_allocation_basis_quantity')
      .send(quantity1)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('Verify that we added a new allocation basis quantity item', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .then((res) => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        quantity1.id = item.id;
        expect(item.basis_id).to.equal(quantity1.basis_id);
        expect(item.cost_center_id).to.equal(quantity1.cost_center_id);
        expect(item.quantity).to.equal(quantity1.quantity);
      })
      .catch(helpers.handler);
  });

  it('Add a second allocation basis quantity item', () => {
    return agent.post('/cost_center_allocation_basis_quantity')
      .send(quantity2)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('Verify that we added a new allocation basis quantity item', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .then((res) => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('Get an allocation basis quantity item by basis_id', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .query({ basis_id : quantity2.basis_id })
      .then((res) => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        expect(item.cost_center_id).to.equal(quantity2.cost_center_id);
      })
      .catch(helpers.handler);
  });

  it('Get an allocation basis quantity item by cost_center_id', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .query({ cost_center_id : quantity1.cost_center_id })
      .then((res) => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        expect(item.basis_id).to.equal(quantity1.basis_id);
      })
      .catch(helpers.handler);
  });

  it('Get an allocation basis quantity item by basis_id and cost_center_id', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .query({
        basis_id : quantity1.basis_id,
        cost_center_id : quantity1.cost_center_id,
      })
      .then((res) => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        expect(item.quantity).to.equal(quantity1.quantity);
      })
      .catch(helpers.handler);
  });

  it('PUT /cost_center_allocation_basis_quantity/:id should update the existing allocation basis quantity item', () => {
    return agent.put(`/cost_center_allocation_basis_quantity/${quantity1.id}`)
      .send(update1)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('Verify the update for the allocation basis quantity item', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .query({ id : quantity1.id })
      .then((res) => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        expect(item.quantity).to.equal(update1.quantity);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cost_center_allocation_basis_quantity/:id should delete an allocation basis item', () => {
    return agent.delete(`/cost_center_allocation_basis_quantity/${quantity1.id}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('Verify that we have deleted one allocation basis quantity item', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .then((res) => {
        helpers.api.listed(res, 1);
        const [item] = res.body;
        quantity2.id = item.id;
      })
      .catch(helpers.handler);
  });

  it('DELETE /cost_center_allocation_basis_quantity/:id should delete the last allocation basis item', () => {
    return agent.delete(`/cost_center_allocation_basis_quantity/${quantity2.id}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('Verify that we have deleted all allocation basis quantity items', () => {
    return agent.get('/cost_center_allocation_basis_quantity')
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

});
