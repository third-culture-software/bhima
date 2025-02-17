/* global expect, agent */
const moment = require('moment');
const helpers = require('../helpers');
const shared = require('./shared');

const STOCK_IMPORTED_FROM_CSV_FILE = 10;
const INVENTORY_ADDED_FROM_CSV_FILE = 2;
const MOVEMENTS_ADDED_FROM_CSV_FILE = 1;

describe('test/integration/stock/stock The Stock API', () => {

  // create new stock lots
  it('POST /stock/lots create a new stock lots entry', async () => {
    const res = await agent.post('/stock/lots')
      .send(shared.movementFirstLots);
    helpers.api.created(res);
  });

  // create stock movement to patient
  it('POST /stock/lots/movements distribute lots to patients from a depot', async () => {
    const res1 = await agent.post('/stock/lots/movements').send(shared.movementOutPatient);
    helpers.api.created(res1);
    // get details of the movement
    const docUuid = res1.body.uuid;
    const res2 = await agent.get(`/stock/lots/movements?document_uuid=${docUuid}`);

    const mvtsByDocument = res2.body;
    const [firstMvt] = mvtsByDocument;
    const res3 = await agent.get(`/stock/lots/movements?reference=${firstMvt.documentReference}`);

    expect(res3.body).to.deep.equal(mvtsByDocument);

  });

  // create stock movement to depot
  it('POST /stock/lots/movements distributes stock lots to a depot', async () => {
    const res = await agent.post('/stock/lots/movements').send(shared.movementDepot);
    helpers.api.created(res);
  });

  // list all movement relatives to 'Depot Principal'
  it(
    `GET /stock/lots/movements?depot_uuid=...
    returns movements for Depot Principal`,
    async () => {
      const res = await (agent.get('/stock/lots/movements')
        .query({ depot_uuid : shared.depotPrincipalUuid }));
      helpers.api.listed(res, shared.depotPrincipalMvt + STOCK_IMPORTED_FROM_CSV_FILE);
    },
  );

  // list all movement relatives to patient 'PA.TPA.2'
  it(
    `GET /stock/lots/movements?patientReference=PA.TPA.2 returns three movements for patient PA.TPA.2`,
    async () => {
      const res = await agent.get('/stock/lots/movements').query({ patientReference : 'PA.TPA.2' });
      helpers.api.listed(res, 4);
    },
  );

  // list all movement relatives to 'Service Administration'
  it(
    `GET /stock/lots/movements?service_uuid=...
    returns movements for Service Uuid (1 OUT)`,
    async () => {
      const res = await (agent.get(`/stock/lots/movements`)
        .query({ service_uuid : shared.serviceAdministrationUuid }));
      helpers.api.listed(res, 1);
    },
  );

  // list all stock exit relatives to 'Depot Principal'
  it(
    `GET /stock/lots/movements?is_exit=1&depot_uuid=...
    returns list of lot exits for Depot Principal`,
    async () => {
      const res = await (agent.get(`/stock/lots/movements`)
        .query({
          is_exit : 1,
          depot_uuid : shared.depotPrincipalUuid,
        }));
      helpers.api.listed(res, 9);
    },
  );

  // (report) render all stock exit
  it(
    `GET /reports/stock/lots?renderer=json returns exits for all depots`,
    async () => {
      const res = await agent.get(`/reports/stock/lots?renderer=json`);
      expect(res.body.rows.length).to.equal(18 + STOCK_IMPORTED_FROM_CSV_FILE);
    },
  );

  // (report) render all stock exit relatives to 'Depot Principal'
  it(
    `GET /reports/stock/lots?renderer=json
    returns render of all lot exits for Depot principal`,
    async () => {
      const res = await (agent.get(`/reports/stock/lots`)
        .query({
          renderer : 'json',
          depot_uuid : shared.depotPrincipalUuid,
        }));
      expect(res.body.rows.length).to.equal(13 + STOCK_IMPORTED_FROM_CSV_FILE);
    },
  );

  // list all stock entry relatives to 'Depot Principal'
  it(
    `GET /stock/lots/movements?is_exit=0&depot_uuid=... returns entries for Depot Principal`,
    async () => {
      const res = await (agent.get('/stock/lots/movements')
        .query({
          is_exit : 0,
          depot_uuid : shared.depotPrincipalUuid,
        }));
      helpers.api.listed(res, 13 + STOCK_IMPORTED_FROM_CSV_FILE);
    },
  );

  // get initial quantity of QUININE-A in 'Depot Principal'
  it(`GET /stock/lots returns initial quantity of QUININE-A in Depot Principal (100pcs)`, async () => {
    const res = await (agent.get('/stock/lots')
      .query({
        lot_uuid : shared.lotQuinineUuid,
        depot_uuid : shared.depotPrincipalUuid,
      }));
    helpers.api.listed(res, 1);
    const lotQuinine = res.body[0];
    expect(lotQuinine.unit_cost).to.equal(1.7);
  });

  // list exit of QUININE-A from 'Depot Principal'
  it(`GET /stock/lots/movements?is_exit=1&lot_uuid=...&depot_uuid=... returns
    exit of QUININE-A from Depot Principal (101pcs)`, async () => {

    const res = await agent.get('/stock/lots/movements')
      .query({
        is_exit : 1,
        lot_uuid : shared.lotQuinineUuid,
        depot_uuid : shared.depotPrincipalUuid,
      });
    helpers.api.listed(res, 2);
    let totalExit = 1;
    res.body.forEach(row => {
      totalExit += row.quantity;
    });
    expect(totalExit).to.equal(101);
  });

  it(`GET /stock/lots/movements filters on user`, async () => {
    const res = await agent.get('/stock/lots/movements').query({ user_id : 1 });
    helpers.api.listed(res, 27 + STOCK_IMPORTED_FROM_CSV_FILE);
  });

  // returns quantity of QUININE-A in 'Depot Principal'
  it(`
    GET /stock/lots/depots?lot_uuid=...&depot_uuid=...
    returns remaining quantity of QUININE-A in Depot Principal (80pcs)`,
  async () => {
    const res = await agent.get(`/stock/lots/depots`)
      .query({
        lot_uuid : shared.lotQuinineUuid,
        depot_uuid : shared.depotPrincipalUuid,
      });

    helpers.api.listed(res, 1);
    expect(res.body[0].quantity).to.equal(0);
  });

  it(`GET /stock/inventories/depots filters on expired lots`, async () => {
    const res = await agent.get(`/stock/inventories/depots`)
      .query({ limit : 1000, includeEmptyLot : 0, is_expired : 1 });
    helpers.api.listed(res, 2 + INVENTORY_ADDED_FROM_CSV_FILE);
  });

  it(`GET /stock/inventories/depots filters on non-expired lots`, async () => {
    const res = await agent.get(`/stock/inventories/depots`)
      .query({ limit : 1000, includeEmptyLot : 0, is_expired : 0 });
    helpers.api.listed(res, 7);
  });

  it(`GET /stock/inventories/depots Get Inventories in Stock By Depot`, async () => {
    const res = await agent.get(`/stock/inventories/depots`)
      .query({
        depot_uuid : shared.depotPrincipalUuid,
        limit : 1000,
        includeEmptyLot : 0,
      });

    helpers.api.listed(res, 3 + INVENTORY_ADDED_FROM_CSV_FILE);

    const labels = [
      'Abaisse langue en bois, 18*140mm, Boîte de 100 unités',
      'Vitamines B1+B6+B12, 100+50+0.5mg/2ml, Amp, Unité',
      'Acide Acetylsalicylique, 500mg, Tab, 1000, Vrac',
      'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité',
      'Honda CRF250RX',
    ];

    const tLabels = res.body.map(i => i.text);
    expect(tLabels).to.deep.equal(labels);
  });

  it('POST /stock/lots create a new stock lots entry from donation', async () => {
    const result = await agent.post('/stock/lots').send(shared.movementFromDonation);
    helpers.api.created(result);

    const res = await agent.get(`/receipts/stock/${result.body.uuid}?lang=fr&posReceipt=0&renderer=json`);
    expect(res).to.have.status(200);

    const { details, rows } = res.body;
    const src = shared.movementFromDonation;

    // check that this is the same record
    expect(details.description).to.equal(src.description);
    const labels = rows.map(row => row.label);
    const srcLabels = src.lots.map(lot => lot.label);
    expect(labels).to.deep.equal(srcLabels);
  });

  // create stock movement to delete
  let movementUuid;
  let quantityBeforeEntry;
  let quantityAfterEntry;
  const quantityForEntry = 77;
  const inventoryQuantityQuery = {
    inventory_uuid : helpers.data.QUININE,
    depot_uuid : shared.depotPrincipalUuid,
  };

  it(`POST /stock/lots/ stock entry movement of ${quantityForEntry} Quinines`, async () => {
    shared.movementFromDonation.lots = shared.movementFromDonation.lots.splice(1);
    shared.movementFromDonation.lots[0].inventory_uuid = helpers.data.QUININE;
    shared.movementFromDonation.lots[0].label = 'don3';
    shared.movementFromDonation.lots[0].quantity = quantityForEntry;

    const res0 = await agent.get(`/stock/inventories/depots`).query(inventoryQuantityQuery);
    quantityBeforeEntry = res0.body[0].quantity;

    expect(quantityBeforeEntry, 'quantity in stock is not equal to quantity')
      .to.equal(res0.body[0].cmms.quantity_in_stock);

    const res = await agent.post('/stock/lots/').send(shared.movementFromDonation);
    movementUuid = res.body.uuid;
    helpers.api.created(res);

    const res2 = await agent.get(`/stock/inventories/depots`).query(inventoryQuantityQuery);
    quantityAfterEntry = res2.body[0].quantity;

    expect(quantityAfterEntry).to.be.equal(quantityBeforeEntry + quantityForEntry);

    expect(quantityAfterEntry, 'quantity in stock is not equal to quantity')
      .to.equal(res2.body[0].cmms.quantity_in_stock);
  });

  it(`DELETE /stock/movements/ delete the stock movement of ${quantityForEntry} Quinines`, async () => {
    const res = await agent.delete(`/stock/movements/${movementUuid}`);
    helpers.api.deleted(res);

    const res2 = await agent.get(`/stock/inventories/depots`).query(inventoryQuantityQuery);
    const currentQuantityAfterDeletion = res2.body[0].quantity;

    expect(currentQuantityAfterDeletion).to.be.equal(quantityBeforeEntry);

    expect(currentQuantityAfterDeletion, 'quantity in stock is not equal to quantity')
      .to.equal(res2.body[0].cmms.quantity_in_stock);
  });

  // create Aggregate consumption
  it('POST /stock/aggregated_consumption create standard aggregate stock consumption', async () => {
    const res = await agent.post('/stock/aggregated_consumption').send(shared.movementStandardAggregate);
    expect(res).to.have.status(201);
  });

  it('POST /stock/aggregated_consumption create complexe aggregate stock consumption', async () => {
    const res = await agent.post('/stock/aggregated_consumption').send(shared.movementComplexeAggregate);
    expect(res).to.have.status(201);
  });

  it('POST /stock/aggregated_consumption Prevent incorrect aggregate consumption', async () => {
    const res = await agent.post('/stock/aggregated_consumption').send(shared.invalidAggregateMovement);
    expect(res).to.have.status(500);
  });

  it('GET /stock/movements returns a list of stock movements', async () => {
    const res = await agent.get('/stock/movements');
    helpers.api.listed(res, 23 + MOVEMENTS_ADDED_FROM_CSV_FILE);
  });

  // FIXME(@jniles) - it looks like auto_stock_accounting is turned off in our
  // test dataset.  This will at least ensure we don't crash.
  it('GET /stock/movements filters by voucher reference', async () => {
    const res = await agent.get('/stock/movements')
      .query({ voucherReference : 'VO.TPA.300000' });
    helpers.api.listed(res, 0);
  });

  // Prevent negative stock quantities
  it(`POST /stock/lots/movements Prevent negative stock quantities when distribute lots to patients from a depot`,
    async () => {
      shared.movementOutPatient.date = moment(new Date(), 'YYYY-MM-DD').subtract(1, 'days');

      const res = await agent.post('/stock/lots/movements').send(shared.movementOutPatient);
      expect(res).to.have.status(400);
    });

  it(`POST /stock/aggregated_consumption movements Prevent negative stock quantities
      create complexe aggregate stock consumption`, async () => {
    const res = await agent.post('/stock/aggregated_consumption').send(shared.movementOverConsumptionAggregate);
    expect(res).to.have.status(400);
  });

  it(`POST /stock/inventory_adjustment movements Prevent negative stock quantities
      create complexe aggregate stock consumption`, async () => {
    const res = await agent.post('/stock/inventory_adjustment').send(shared.adjustmentPrevention);
    expect(res).to.have.status(400);
  });

});
