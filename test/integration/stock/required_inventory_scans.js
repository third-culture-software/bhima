

const moment = require('moment');
const helpers = require('../helpers');
const shared = require('./shared');

const newRequiredInventoryScan1 = {
  title : '2023 Q1 Inventory Scan for Primary Depot',
  description : '',
  start_date : new Date(),
  end_date : moment(new Date(), 'YYYY-MM-DD').add(90, 'days'),
  depot_uuid : shared.depotPrincipalUuid,
  is_asset : true,
  reference_number : null,
};

describe('test/integration/stock/required_inventory_scans The Stock Asset Inventory Scans API', () => {
  const variables = {};
  const keys = ['uuid', 'title', 'description', 'start_date', 'end_date', 'is_asset',
    'reference_number', 'created_at', 'updated_at',
    'depot_uuid', 'depot_name',
  ];

  // create new asset inventory scan
  it('POST /inventory/required/scan create a new required asset inventory scan', () => {
    return agent.post('/inventory/required/scan')
      .send(newRequiredInventoryScan1)
      .then((res) => {
        helpers.api.created(res);
        variables.assetInvScan1 = res.body;
      })
      .catch(helpers.handler);
  });

  // Get asset inventory scan by its uuid
  it('GET /inventory/required/scan get assignment by its uuid', () => {
    return agent.get(`/inventory/required/scan/${variables.assetInvScan1.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body).to.have.all.keys(keys);
        expect(res.body.uuid).to.be.equal(variables.assetInvScan1.uuid);
        variables.assetInvScan1.created_at = res.body.created_at;
        variables.assetInvScan1.updated_at = res.body.updated_at;
      })
      .catch(helpers.handler);
  });

  // search by by filters (depot)
  it('GET /inventory/required/scans for a given depot', () => {
    return agent.get(`/inventory/required/scans?depot_uuid=${shared.depotPrincipalUuid}&is_asset=1`)
      .then(res => {
        expect(res).to.have.status(200);
        helpers.api.listed(res, 1);
        const aiScan = res.body[0];
        expect(aiScan.uuid).to.equal(variables.assetInvScan1.uuid);
      })
      .catch(helpers.handler);
  });

  // search by filters (title) - should not find one
  it('GET /inventory/required/scans for a given asset label', () => {
    return agent.get('/inventory/required/scans?title=NONE')
      .then(res => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  /**
   * Test updating an asset inventory scan
   */
  it(`PUT /inventory/required/scan/:uuid update asset inventory scan`, () => {
    const update = {
      depot_uuid : shared.depotSecondaireUuid,
      is_asset : false,
      description : 'New description',
    };

    return agent.put(`/inventory/required/scan/${variables.assetInvScan1.uuid}`)
      .send(update)
      .then(updated => {
        expect(updated).to.have.status(200);
        return agent.get(`/inventory/required/scan/${variables.assetInvScan1.uuid}`);
      })
      .then(res => {
        expect(res).to.be.an('object');
        const aiScan = res.body;
        expect(res.body).to.have.all.keys(keys);
        expect(aiScan.description, 'desc').to.equal(update.description);
        expect(aiScan.depot_name, 'depot').to.equal('Depot Secondaire');
        expect(aiScan.is_asset, 'is_asset').to.equal(0);
        expect(aiScan.created_at).to.equal(variables.assetInvScan1.created_at);
        // The following test will fail sometimes because the fractional seconds
        // resolution of TIMESTAMP in MySQL is 0 (no fractional seconds)
        // expect(aiScan.updated_at).to.not.equal(variables.assetInvScan1.updated_at);
      })
      .catch(helpers.handler);
  });

  // delete the asset scan
  it(`DELETE /inventory/required/scan/:uuid/delete delete asset scan`, () => {
    return agent.delete(`/inventory/required/scan/${variables.assetInvScan1.uuid}/delete`)
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get('/inventory/required/scans');
      })
      .then(res => {
        const doesnExist = res.body.map(item => item.uuid)
          .filter(uuid => uuid === variables.assetInvScan1.uuid)
          .length === 0;
        expect(doesnExist).to.be.equal(true);
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

});
