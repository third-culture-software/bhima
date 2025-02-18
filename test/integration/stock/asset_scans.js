/* global expect, agent */

const helpers = require('../helpers');
const shared = require('./shared');

const newAssetScan1 = {
  asset_uuid : shared.assetMot1,
  depot_uuid : shared.depotPrincipalUuid,
  condition_id : 1,
  notes : 'Test scan 1',
};

describe('test/integration/asset_scans The Stock Asset Scan API', () => {
  const variables = {};
  const keys = [
    'asset_label', 'asset_uuid', 'assigned_to_name', 'condition_id',
    'created_at', 'updated_at', 'depot_text', 'depot_uuid',
    'group_name', 'group_uuid', 'inventory_code', 'inventory_text',
    'inventory_uuid', 'location_uuid', 'manufacturer_brand', 'manufacturer_model',
    'notes', 'scanned_by', 'scanned_by_name', 'serial_number', 'reference_number',
    'unit_cost', 'uuid', 'funding_source_label', 'funding_source_uuid',
    'funding_source_code',
  ];

  // create new asset scan for MOT1
  it('POST /asset/scan create a new asset scan', () => {
    return agent.post('/asset/scan')
      .send(newAssetScan1)
      .then((res) => {
        helpers.api.created(res);
        variables.newScan1ID = res.body.uuid;
        variables.assetScan1 = res.body;
      })
      .catch(helpers.handler);
  });

  // Get asset scan by its uuid
  it('GET /asset/scan get assignment by its uuid', () => {
    return agent.get(`/asset/scan/${variables.newScan1ID}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body.uuid).to.be.equal(variables.newScan1ID);
        expect(res.body).to.have.all.keys(keys);
        variables.assetScan1date = res.body.updated_at;
        variables.assetScan1_created_at = res.body.created_at;
      })
      .catch(helpers.handler);
  });

  // search assignments by filters (depot)
  it('GET /asset/scans for a given depot', () => {
    return agent.get(`/asset/scans?depot_uuid=${shared.depotPrincipalUuid}`)
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  // search assignments by filters (asset label )
  it('GET /asset/scans for a given asset label', () => {
    return agent.get('/asset/scans?asset_label=MOT2')
      .then(res => {
        helpers.api.listed(res, 1);
        const asset = res.body[0];
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(asset.asset_label).to.be.equal('MOT2');
      })
      .catch(helpers.handler);
  });

  /**
   * Test updating an asset scan
   */
  it(`PUT /asset/scan/:uuid update asset scan`, () => {
    const update = {
      depot_uuid : shared.depotSecondaireUuid,
      condition_id : 2,
      asset_uuid : shared.assetMot1,
      notes : 'Updated notes',
    };

    return agent.put(`/asset/scan/${variables.newScan1ID}`)
      .send(update)
      .then(updated => {
        expect(updated).to.have.status(200);
        return agent.get(`/asset/scan/${variables.newScan1ID}`);
      })
      .then(res => {
        expect(res).to.be.an('object');
        const uscan = res.body;
        expect(uscan.notes).to.equal(update.notes);
        expect(uscan.depot_text).to.equal('Depot Secondaire');
        expect(uscan.condition_id).to.equal(update.condition_id);
        expect(uscan.asset_uuid).to.equal(update.asset_uuid);
        expect(uscan.asset_label).to.equal('MOT1');
        expect(uscan.created_at).to.equal(variables.assetScan1_created_at);
        // The following test will fail sometimes because the fractional seconds
        // resolution of TIMESTAMP in MySQL is 0 (no fractional seconds)
        // expect(uscan.updated_at).to.not.equal(variables.assetScan1_created_at);
        expect(res.body).to.have.all.keys(keys);
      })
      .catch(helpers.handler);
  });

  // delete the asset scan
  it(`DELETE /asset/scan/:uuid/delete delete asset scan`, () => {
    return agent.delete(`/asset/scan/${variables.newScan1ID}/delete`)
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get('/asset/scans');
      })
      .then(res => {
        const doesnExist = res.body.map(item => item.uuid)
          .filter(uuid => uuid === variables.newScan1ID)
          .length === 0;
        expect(doesnExist).to.be.equal(true);
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

});
