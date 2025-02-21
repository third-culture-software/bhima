/* eslint-disable max-len */
/* global expect, agent */

const fs = require('fs');
const helpers = require('../helpers');
const shared = require('./shared');

const templateColumns = [
  'inventory_group_name', 'inventory_code', 'inventory_text', 'inventory_type',
  'inventory_unit', 'inventory_unit_price', 'inventory_cmm', 'inventory_consumable',
  'inventory_is_asset', 'inventory_brand', 'inventory_model', 'stock_lot_label',
  'stock_lot_quantity', 'stock_lot_expiration', 'stock_serial_number', 'stock_funding_source',
  'acquisition_date', 'depreciation_rate',
];

const templateValue = [
  'Produits Oraux', '00001', 'Quinine sulfate 500mg', 'article',
  'pilule', '0.02', '300', '1',
  '0', '', '', 'QNN2020',
  '24000', '2030-12-31', '123456', 'ASSP',
  '2022-09-07', '8.65',
];

describe('test/integration/stock/import The stock import API', () => {
  const templateCsvHeader = templateColumns.join(',');
  const templateCsvContent = templateValue.map(i => `${i}`).join(',');
  const file = './test/fixtures/stock-to-import.csv';
  const invalidFile = './test/fixtures/bad-stock-to-import.csv';
  const filename = 'stock-to-import.csv';
  const fileMissingInventoryText = './test/fixtures/stock-to-import-missing-inventory-text.csv';
  const fileMissingInventoryType = './test/fixtures/stock-to-import-missing-inventory-type.csv';
  const fileMissingInventoryUnit = './test/fixtures/stock-to-import-missing-inventory-unit.csv';
  const fileMissingLotLabel = './test/fixtures/stock-to-import-missing-lot-label.csv';
  const fileMissingLotQuantity = './test/fixtures/stock-to-import-missing-lot-quantity.csv';
  const numberOfStockToAdd = 10;

  const params = { depot_uuid : shared.depotPrincipalUuid };

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];

  let totalLotsBeforeImport;

  /**
   * test the /stock/import API for downloading
   * the stock template file
   */
  it('GET /stock/import/template download the inventory template file', () => {
    return agent.get('/stock/import/template')
      .then(res => {
        expect(res).to.have.status(200);
        const pattern = String(res.text).includes('\r\n') ? '\r\n' : '\n';
        const [header, content] = String(res.text).split(pattern);
        expect(header).to.be.equal(templateCsvHeader);
        expect(content).to.be.equal(templateCsvContent);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /stock/import API for importing
   * stock from a csv file and comparing totals before and after the import
   */
  it('POST /stock/import/ upload the filled template file as new import for stock', () => {

    // get the number of lots before the import
    return agent.get(`/stock/lots/depots?depot_uuid=${params.depot_uuid}`)
      .then(res => {
        totalLotsBeforeImport = res.body.length;

        // import inventories from a csv file
        return agent.post('/stock/import')
          .type('form')
          .field('depot_uuid', params.depot_uuid)
          .field('date', formattedDate)
          /**
           * to attach file into req.files please use fs.createReadStream
           * fs.readFileSync doesn't work because it insert the file into req.body.file
           */
          .attach('file', fs.createReadStream(file), filename)
          .then(innerRes => {
            expect(innerRes).to.have.status(201);

            // get the number of lots after the import
            return agent.get(`/stock/lots/depots?depot_uuid=${params.depot_uuid}`);
          });
      })
      .then(res => {
        const totalLotsAfterImport = res.body.length;

        expect(totalLotsAfterImport).to.be.equal(totalLotsBeforeImport + numberOfStockToAdd);
      })
      .catch(helpers.handler);
  });

  /**
   * test an upload of a bad csv file with missing required columns
   */
  it('POST /stock/import blocks an upload of a bad csv file (missing inventory_group_name) for inventory import', () => {
    return agent.post('/stock/import')
      .type('form')
      .field('depot_uuid', params.depot_uuid)
      .field('date', formattedDate)
      .attach('file', fs.createReadStream(invalidFile))
      .then(res => {
        const errorMsg = `[Row:  2] 'inventory_group_name' is incorrect :  [undefined], must be a valid text`;
        helpers.api.errored(res, 400, errorMsg);
      })
      .catch(helpers.handler);
  });

  it('POST /stock/import blocks an upload of a bad csv file (missing inventory_text) for inventory import', () => {
    return agent.post('/stock/import')
      .type('form')
      .field('depot_uuid', params.depot_uuid)
      .field('date', formattedDate)
      .attach('file', fs.createReadStream(fileMissingInventoryText))
      .then(res => {
        const errorMsg = `[Row:  2] 'inventory_text' is incorrect :  [undefined], must be a valid text`;
        helpers.api.errored(res, 400, errorMsg);
      })
      .catch(helpers.handler);
  });

  it('POST /stock/import blocks an upload of a bad csv file (missing inventory_type) for inventory import', () => {
    return agent.post('/stock/import')
      .type('form')
      .field('depot_uuid', params.depot_uuid)
      .field('date', formattedDate)
      .attach('file', fs.createReadStream(fileMissingInventoryType))
      .then(res => {
        const errorMsg = `[Row:  2] 'inventory_type' is incorrect :  [undefined], must be a valid text`;
        helpers.api.errored(res, 400, errorMsg);
      })
      .catch(helpers.handler);
  });

  it('POST /stock/import blocks an upload of a bad csv file (missing inventory_unit) for inventory import', () => {
    return agent.post('/stock/import')
      .type('form')
      .field('depot_uuid', params.depot_uuid)
      .field('date', formattedDate)
      .attach('file', fs.createReadStream(fileMissingInventoryUnit))
      .then(res => {
        const errorMsg = `[Row:  2] 'inventory_unit' is incorrect :  [undefined], must be a valid text`;
        helpers.api.errored(res, 400, errorMsg);
      })
      .catch(helpers.handler);
  });

  it('POST /stock/import blocks an upload of a bad csv file (missing stock_lot_label) for inventory import', () => {
    return agent.post('/stock/import')
      .type('form')
      .field('depot_uuid', params.depot_uuid)
      .field('date', formattedDate)
      .attach('file', fs.createReadStream(fileMissingLotLabel))
      .then(res => {
        const errorMsg = `[Row:  2] 'stock_lot_label' is incorrect : [undefined], must be a valid text`;
        helpers.api.errored(res, 400, errorMsg);
      })
      .catch(helpers.handler);
  });

  it('POST /stock/import blocks an upload of a bad csv file (missing stock_lot_quantity) for inventory import', () => {
    return agent.post('/stock/import')
      .type('form')
      .field('depot_uuid', params.depot_uuid)
      .field('date', formattedDate)
      .attach('file', fs.createReadStream(fileMissingLotQuantity))
      .then(res => {
        const errorMsg = `[Row:  2] 'stock_lot_quantity' is incorrect : [undefined], must be a number`;
        helpers.api.errored(res, 400, errorMsg);
      })
      .catch(helpers.handler);
  });
});
