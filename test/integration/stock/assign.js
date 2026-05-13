

const helpers = require('../helpers');
const shared = require('./shared');

describe('test/integration/stock/assign The Stock Assign API', () => {
  const variables = {};
  const keys = [
    'uuid', 'lot_uuid', 'depot_uuid', 'entity_uuid',
    'quantity', 'created_at', 'updated_at', 'description', 'is_active',
  ];

  // create new stock assignment from "Depot Principal" to a person entity
  it('POST /stock/assign create a new stock assignment to a person', () => {
    return agent.post('/stock/assign')
      .send(shared.newPersonAssign)
      .then((res) => {
        helpers.api.created(res);
        variables.newPersonAssignUuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  // create new stock assignment from "Depot Principal" to an office entity
  it('POST /stock/assign create a new stock assignment to office', () => {
    return agent.post('/stock/assign')
      .send(shared.newEnterpriseAssign)
      .then((res) => {
        helpers.api.created(res);
        variables.newEnterpriseAssignUuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  // create new stock assignment from "Depot Secondaire" to a person
  it('POST /stock/assign create a new stock assignment to a person', () => {
    return agent.post('/stock/assign')
      .send(shared.newPersonAssign2)
      .then((res) => {
        helpers.api.created(res);
        variables.newPersonAssign2Uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  // list all stock assignment
  it('GET /stock/assign list all stock assignments', () => {
    return agent.get('/stock/assign')
      .then(res => {
        helpers.api.listed(res, 4);
      })
      .catch(helpers.handler);
  });

  // get assignment details by its uuid
  it('GET /stock/assign get assignment by its uuid', () => {
    return agent.get(`/stock/assign/${variables.newPersonAssignUuid}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body.uuid).to.be.equal(variables.newPersonAssignUuid);
        expect(res.body).to.have.all.keys(keys);
      })
      .catch(helpers.handler);
  });

  // search assignments by filters
  it('GET /stock/assign get assignments of a given depot', () => {
    return agent.get(`/stock/assign?depot_uuid=${shared.depotPrincipalUuid}`)
      .then(res => {
        helpers.api.listed(res, 3);
        return agent.get(`/stock/assign?depot_uuid=${shared.depotSecondaireUuid}`);
      })
      .then(res => helpers.api.listed(res, 1))
      .catch(helpers.handler);
  });

  it('GET /stock/assign get assignments to a given entity', () => {
    return agent.get(`/stock/assign?entity_uuid=${shared.personEntityUuid}`)
      .then(res => {
        helpers.api.listed(res, 3);
        return agent.get(`/stock/assign?entity_uuid=${shared.enterpriseEntityUuid}`);
      })
      .then(res => helpers.api.listed(res, 1))
      .catch(helpers.handler);
  });

  /**
   * This feature is not implemented on client due to the lack of information
   * which can be introduced by the stock assign edit feature.
   */
  it(`PUT /stock/assign/:uuid update stock assignment`, () => {
    const update = {
      lot_uuid : shared.lotVitamineA,
      depot_uuid : shared.depotSecondaireUuid,
      entity_uuid : shared.enterpriseEntityUuid,
      quantity : 2,
      is_active : 0,
      description : 'Assign stock to an enterprise instead of a person',
    };
    return agent.put(`/stock/assign/${variables.newPersonAssignUuid}`)
      .send(update)
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get(`/stock/assign/${variables.newPersonAssignUuid}`);
      })
      .then(res => {
        expect(res).to.be.an('object');
        expect(res.body.uuid).to.equal(variables.newPersonAssignUuid);
        expect(res.body.lot_uuid).to.equal(update.lot_uuid);
        expect(res.body.depot_uuid).to.equal(update.depot_uuid);
        expect(res.body.entity_uuid).to.equal(update.entity_uuid);
        expect(res.body.quantity).to.equal(update.quantity);
        expect(res.body.description).to.equal(update.description);
        expect(res.body.is_active).to.equal(update.is_active);
        expect(res.body).to.have.all.keys(keys);
      })
      .catch(helpers.handler);
  });

  // remove assignment (set is_active = 0) but not delete it
  it(`PUT /stock/assign/:uuid/remove remove stock assignment`, () => {
    return agent.put(`/stock/assign/${variables.newPersonAssignUuid}/remove`)
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get(`/stock/assign/${variables.newPersonAssignUuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.is_active).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  // delete the assignment
  it(`DELETE /stock/assign/:uuid/delete delete stock assignment`, () => {
    return agent.delete(`/stock/assign/${variables.newPersonAssignUuid}/delete`)
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get('/stock/assign');
      })
      .then(res => {
        const doesnExist = res.body.map(item => item.uuid)
          .filter(uuid => uuid === variables.newPersonAssignUuid)
          .length === 0;
        expect(doesnExist).to.be.equal(true);
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

});
