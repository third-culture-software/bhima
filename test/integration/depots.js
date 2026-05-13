

const helpers = require('./helpers');

// The /depots API
describe('test/integration/depots Depots API', () => {

  const principalDepotUuid = 'f9caeb16-1684-43c5-a6c4-47dbac1df296';
  const secondaryDepotUuid = 'd4bb1452-e4fa-4742-a281-814140246877';
  // new depot object
  const newDepot = {
    // the reference column is auto increment by a trigger
    text : 'New Depot',
    enterprise_id : 1,
    is_warehouse : 0,
    parent_uuid : 0,
    default_purchase_interval : 0,
  };

  // second depot object
  const secondDepot = {
    text : 'Second Depot',
    enterprise_id : 1,
    is_warehouse : 0,
    parent_uuid : 0,
    default_purchase_interval : 0,
  };

  // depot object with missing uuid
  const badDepot = {
    text : 'New Depot',
    enterprise_id : 1,
    is_warehouse : 0,
    parent_uuid : 0,
    default_purchase_interval : 0,
  };

  // removable depot
  const removableDepot = {
    text : 'Removable Depot',
    enterprise_id : 1,
    is_warehouse : 1,
    parent_uuid : 0,
    default_purchase_interval : 0,
  };

  // depot with allocation depots
  const newDepotWithDistribution = {
    text : 'Depot With Distribution Restriction',
    enterprise_id : 1,
    is_warehouse : 1,
    parent_uuid : 0,
    allowed_distribution_depots : [principalDepotUuid, secondaryDepotUuid],
    default_purchase_interval : 0,
  };

  const editDepot = {
    text : 'Edited Depot',
    is_warehouse : 1,
    allow_entry_purchase : 1,
    allow_entry_integration : 1,
    allow_entry_donation : 1,
    allow_entry_transfer : 1,
    allow_exit_debtor : 1,
    allow_exit_service : 1,
    allow_exit_transfer : 1,
    allow_exit_loss : 1,
    parent_uuid : secondaryDepotUuid,
    default_purchase_interval : 0,
  };

  it('POST /depots create a new depot in the database', () => {
    return agent.post('/depots')
      .send(newDepot)
      .then((res) => {
        helpers.api.created(res);
        newDepot.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /depots create a second depot (without sending uuid)', () => {
    return agent.post('/depots')
      .send(secondDepot)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /depots should not create when missing data', () => {
    delete badDepot.text;
    return agent.post('/depots')
      .send(badDepot)
      .then((res) => {
        helpers.api.errored(res, 400);
        expect(res.body.code).to.be.equal('ERRORS.ER_NO_DEFAULT_FOR_FIELD');
      })
      .catch(helpers.handler);
  });

  it('POST /depots create a new depot with allocation restriction ', () => {
    return agent.post('/depots')
      .send(newDepotWithDistribution)
      .then((res) => {
        helpers.api.created(res);
        return agent.get(`/depots/${res.body.uuid}`);
      })
      .then(res => {
        // with enable_strict_depot_distribution = 0 by default, we cannot assign
        // allowed_distribution_depots, and the correct comparison must be
        // res.body.allowed_distribution_depots = newDepotWithDistribution.allowed_distribution_depots;
        expect(res.body.allowed_distribution_depots).to.have.length(0);
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/inventories returns inventory for a depot (integration)', () => {
    const { principal } = helpers.data.depots;

    const principalInventoryItems = [
      'Vitamines B1+B6+B12, 100+50+0.5mg/2ml, Amp, Unité',
      'Erythromycine, 500mg, Tab, 500, Vrac',
      'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité',
      'Honda CRF250RX',
    ];

    return agent.get(`/depots/${principal}/inventories`)
      .then(res => {
        helpers.api.listed(res, 4);

        const unique = (item, index, array) => array.indexOf(item) === index;

        // assert that only inventory from this depot were recovered
        const uniqueDepots = res.body
          .map(row => row.depot_text)
          .filter(unique);

        expect(uniqueDepots).to.have.length(1);
        expect(uniqueDepots[0]).to.equal('Depot Principal');

        // the inventory items should be distinct
        const uniqueInventory = res.body
          .map(row => row.text)
          .filter(unique);
        expect(uniqueInventory).to.have.length(4);
        expect(uniqueInventory).to.deep.equal(principalInventoryItems);
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/users returns the users who have access to a depot', () => {
    const { principal } = helpers.data.depots;
    return agent.get(`/depots/${principal}/users`)
      .then(res => {
        helpers.api.listed(res, 1);

        const [user] = res.body;
        expect(user.username).to.equal('superuser');
      })
      .catch(helpers.handler);
  });

  it.skip('GET /depots/:uuid/inventories/:uuid/cmm returns the CMM for a depot', () => {
    const { principal } = helpers.data.depots;
    const { QUININE } = helpers.data;
    return agent.get(`/depots/${principal}/inventories/${QUININE}/cmm`)
      .then(res => {
        expect(res).to.be.json;  
        expect(res.body).to.have.any.keys('algo_def', 'algo_msh');
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/inventories/:uuid/lots returns the lots for a depot', () => {
    const { principal } = helpers.data.depots;
    const { QUININE } = helpers.data;
    return agent.get(`/depots/${principal}/inventories/${QUININE}/lots`)
      .then(res => {
        helpers.api.listed(res, 3);

        const unique = (item, index, array) => array.indexOf(item) === index;

        // assert that only inventory from this depot were recovered
        const uniqueDepots = res.body
          .map(row => row.depot_text)
          .filter(unique);

        expect(uniqueDepots).to.have.length(1);
        expect(uniqueDepots[0]).to.equal('Depot Principal');

        // the inventory items should be distinct
        const uniqueInventory = res.body
          .map(row => row.text)
          .filter(unique);

        expect(uniqueInventory).to.have.length(1);
        expect(uniqueInventory[0]).to.equal(
          'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité',
        );

        const uniqueLots = res.body
          .map(row => row.label)
          .filter(unique);

        expect(uniqueLots).to.have.length(3);
        expect(uniqueLots).to.deep.equal([
          'QUININE-A', 'QUININE-B', 'QUININE-C',
        ]);

      })
      .catch(helpers.handler);
  });

  it('PUT /depots update an existing depot', () => {
    return agent.put(`/depots/${newDepot.uuid}`)
      .send(editDepot)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body[0].text).to.be.equal(editDepot.text);
        expect(res.body[0].is_warehouse).to.be.equal(editDepot.is_warehouse);

        expect(res.body[0].allow_entry_purchase).to.be.equal(editDepot.allow_entry_purchase);

        expect(res.body[0].allow_entry_integration).to.be.equal(editDepot.allow_entry_integration);

        expect(res.body[0].allow_entry_donation).to.be.equal(editDepot.allow_entry_donation);

        expect(res.body[0].allow_entry_transfer).to.be.equal(editDepot.allow_entry_transfer);

        expect(res.body[0].allow_exit_debtor).to.be.equal(editDepot.allow_exit_debtor);

        expect(res.body[0].allow_exit_service).to.be.equal(editDepot.allow_exit_service);

        expect(res.body[0].allow_exit_transfer).to.be.equal(editDepot.allow_exit_transfer);

        expect(res.body[0].allow_exit_loss).to.be.equal(editDepot.allow_exit_loss);

        expect(res.body[0].parent_uuid).to.be.equal(editDepot.parent_uuid);
      })
      .catch(helpers.handler);
  });

  it('GET /depots should returns the list of depots', () => {
    return agent.get('/depots')
      .then((res) => {
        helpers.api.listed(res, 6);
      })
      .catch(helpers.handler);
  });

  it('POST /depots create a removable depot in the database', () => {
    return agent.post('/depots')
      .send(removableDepot)
      .then((res) => {
        helpers.api.created(res);
        removableDepot.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('DELETE /depots should delete an existing depot', () => {
    return agent.delete(`/depots/${removableDepot.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/management : Search for managers of a depot', () => {
    return agent.get(`/depots/${principalDepotUuid}/management`)
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/management : Search for supervisors of a depot', () => {
    return agent.get(`/depots/${principalDepotUuid}/supervision`)
      .then(res => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

});
