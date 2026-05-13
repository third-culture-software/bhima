

const { it } = require('mocha');
const helpers = require('./helpers');

/*
 * The /fee_center  API
 *
 * This test suite implements full CRUD on the /cost_center_allocation_basis API.
 */  
describe('test/integration/costCenterAllocationBasis The cost center step-down allocation basis API', () => {

  const basis = {
    name : 'Laundry Processed',
    units : 'kg',
    description : 'Amount of laundry processed by service',
  };

  const update = {
    name : 'Laundry washed',
    units : 'lb',
  };

  let newBasisId = null;

  const numPredefined = 8;

  it('GET /cost_center_allocation_basis returns a list of allocation basis items', () => {
    return agent.get('/cost_center_allocation_basis')
      .then((res) => {
        helpers.api.listed(res, numPredefined);
      })
      .catch(helpers.handler);
  });

  it('POST /cost_center_allocation_basis should create a new allocation basis item', () => {
    return agent.post('/cost_center_allocation_basis')
      .send(basis)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('Verify that we added a new allocation basis item', () => {
    return agent.get('/cost_center_allocation_basis')
      .then((res) => {
        helpers.api.listed(res, numPredefined + 1);
        const items = res.body;
        // Verify that the new item is not predefined
        const notPredefined = items.reduce((sum, item) => {
          return sum + (item.is_predefined ? 0 : 1);
        }, 0);
        expect(notPredefined, 1);
        const item = items.find(elt => !elt.is_predefined);
        newBasisId = item.id;
        expect(item.name).to.equal(basis.name);
        expect(item.units).to.equal(basis.units);
        expect(item.description).to.equal(basis.description);
      })
      .catch(helpers.handler);
  });

  it('GET /cost_center_allocation_basis/:ID result should be empty for an unknown id', () => {
    return agent.get('/cost_center_allocation_basis/123456789')
      .then((res) => {
        expect(res).to.have.status(404);
      })
      .catch(helpers.handler);
  });

  it('PUT /cost_center_allocation_basis/:ID should update the existing allocation basis item', () => {
    return agent.put(`/cost_center_allocation_basis/${newBasisId}`)
      .send(update)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('GET /cost_center_allocation_basis/:ID get the newly updated allocation basis item', () => {
    return agent.get(`/cost_center_allocation_basis/${newBasisId}`)
      .then((res) => {
        expect(res).to.have.status(200);
        const item = res.body;
        expect(item.name).to.equal(update.name);
        expect(item.units).to.equal(update.units);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cost_center_allocation_basis/:id should delete an allocation basis item', () => {
    return agent.delete(`/cost_center_allocation_basis/${newBasisId}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('Verify that we have the same number allocation basis items as when we started', () => {
    return agent.get('/cost_center_allocation_basis')
      .then((res) => {
        helpers.api.listed(res, numPredefined);
      })
      .catch(helpers.handler);
  });

});
