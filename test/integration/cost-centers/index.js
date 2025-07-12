/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('../helpers');

/*
 * The /cost_center  API
 *
 * This test suite implements full CRUD on the /cost_center  API.
 */
describe('test/integration/cost-centers/index The /cost_center API', () => {
  // Cost Center we will add during this test suite.

  const { services } = helpers.data;

  const costCenter = {
    id : 10,
    label : 'Centre de Frais Test',
    is_principal : 1,
    project_id : 1,
    allocation_method : 'proportional',
    allocation_basis_id : 1,
    reference_cost_center : [{
      account_reference_id : 6,
      is_cost : 1,
    }, {
      account_reference_id : 8,
      is_cost : 0,
    }],
    services : [services.newService, services.newService2],
  };

  const costCenterUpt1 = {
    label : 'Update Test',
    is_principal : 1,
    project_id : 3,
    allocation_method : 'proportional',
    allocation_basis_id : 2,
    reference_cost_center : [{
      account_reference_id : 6,
      is_cost : 1,
    }, {
      account_reference_id : 8,
      is_cost : 0,
    }],
    services : [],
  };

  const costCenterUpt2 = {
    label : 'Update Test',
    is_principal : 0,
    allocation_method : 'proportional',
    allocation_basis_id : 3,
    reference_cost_center : [{
      account_reference_id : 8,
      is_cost : 0,
    }],
    services : [],
  };

  const numCostCenter = 6;
  const costCenterId = 7;

  it('GET /cost_center returns a list of Fees Centers', () => {
    return agent.get('/cost_center')
      .then((res) => {
        helpers.api.listed(res, numCostCenter);
      })
      .catch(helpers.handler);
  });

  it('POST /cost_center should create a new Cost Center', () => {
    return agent.post('/cost_center')
      .send(costCenter)
      .then((res) => {
        const response = res.body;
        expect(response.length).to.equal(2);
      })
      .catch(helpers.handler);
  });

  it('GET /cost_center/:ID result should be empty for an unknown id', () => {
    return agent.get('/cost_center/123456789')
      .then((res) => {
        const response = res.body;
        expect(res).to.have.status(200);
        expect(response.costCenter.length).to.equal(0);
        expect(response.references.length).to.equal(0);
      })
      .catch(helpers.handler);
  });

  it('GET /cost_center/:ID result should be empty if the cost center id is a string', () => {
    return agent.get('/cost_center/str')
      .then((res) => {
        const response = res.body;
        expect(res).to.have.status(200);
        expect(response.costCenter.length).to.equal(0);
        expect(response.references.length).to.equal(0);
      })
      .catch(helpers.handler);
  });

  it('GET /cost_center/:ID result should be empty when the id is a string', () => {
    return agent.get('/cost_center/str')
      .then((res) => {
        const response = res.body;
        expect(res).to.have.status(200);
        expect(response.costCenter.length).to.equal(0);
        expect(response.references.length).to.equal(0);
      })
      .catch(helpers.handler);
  });

  it('PUT /cost_center/:ID should update the Label for an existing Cost Center ', () => {
    return agent.put('/cost_center/'.concat(costCenterId))
      .send(costCenterUpt1)
      .then((res) => {
        const response = res.body;
        expect(res).to.have.status(200);
        expect(response.costCenter[0].label).to.equal('Update Test');
        expect(response.costCenter[0].allocation_basis.id).to.equal(2);
        expect(response.costCenter[0].allocation_basis.name).to.equal('ALLOCATION_BASIS_NUM_EMPLOYEES');
      })
      .catch(helpers.handler);
  });

  it('PUT /cost_center/:ID should return 400 for an non-existing Cost Center ', () => {
    return agent.put('/cost_center/4321')
      .send(costCenterUpt2)
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('PUT /cost_center should return 400 if the Cost Center id is a string ', () => {
    return agent.put('/cost_center/str')
      .send(costCenterUpt2)
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('PUT /cost_center  should update Cost Center Type, Reference fee Center for an existing Cost Center ', () => {
    return agent.put('/cost_center/'.concat(costCenterId))
      .send(costCenterUpt2)
      .then((res) => {
        const response = res.body;
        expect(res).to.have.status(200);
        expect(response.costCenter[0].is_principal).to.equal(costCenterUpt2.is_principal);
        expect(response.references[0].account_reference_id).to.equal(
          costCenterUpt2.reference_cost_center[0].account_reference_id,
        );
        expect(response.references[0].is_cost).to.equal(costCenterUpt2.reference_cost_center[0].is_cost);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cost_center/:id should delete a Cost Center', () => {
    return agent.delete('/cost_center/'.concat(costCenterId))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cost_center/:id should return 404 for an unknown cost center', () => {
    return agent.delete('/cost_center/'.concat(404))
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
