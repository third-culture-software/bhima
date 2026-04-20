const fs = require('node:fs');
const helpers = require('../helpers');

describe('test/integration/inventory/import The inventory import API', () => {
  const templateCsvContent = 'inventory_group_name, inventory_code, inventory_text, inventory_type, inventory_unit, '
    + 'inventory_unit_price, inventory_consumable, inventory_is_asset, depreciation_rate, inventory_brand, '
    + 'inventory_model';

  const file = './test/fixtures/inventory-to-import.csv';
  const invalidFile = './test/fixtures/bad-inventory-to-import.csv';
  const filename = 'inventory-to-import.csv';
  const numberOfInventoriesToAdd = 2;

  let totalInventoriesBeforeImport;

  /**
   * test the /inventory/import API for downloading
   * the inventory template file
   */
  it('GET /inventory/import/template_file download the inventory template file', () => {
    return agent.get('/inventory/import/template_file')
      .then(res => {
        expect(res).to.have.status(200);
        expect(String(res.text).trim()).to.be.equal(templateCsvContent);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /inventory/import API for importing
   * inventories from a csv file and comparing totals before and after the import
   */
  it('POST /inventory/import/ upload the filled template file as new import for inventories', () => {

    // get the number of inventory before the import
    return agent.get('/inventory/metadata')
      .then(res => {
        totalInventoriesBeforeImport = res.body.length;

        // import inventories from a csv file
        return agent.post('/inventory/import')
          /**
           * to attach file into req.files please use fs.createReadStream
           * fs.readFileSync doesn't work because it insert the file into req.body.file
           */
          .attach('file', fs.createReadStream(file), filename)
          .then(innerRes => {
            expect(innerRes).to.have.status(200);

            // get the number of inventories after the import
            return agent.get('/inventory/metadata?skipTags=1');
          });
      })
      .then(res => {
        const totalInventoriesAfterImport = res.body.length;
        expect(totalInventoriesAfterImport).to.be.equal(totalInventoriesBeforeImport + numberOfInventoriesToAdd);
      })
      .catch(helpers.handler);
  });

  /**
   * test an upload of a bad csv file
   */
  it('POST /inventory/import blocks an upload of a bad csv file for inventory import', () => {
    return agent.post('/inventory/import')
      .attach('file', fs.createReadStream(invalidFile))
      .then(res => {
        helpers.api.errored(res, 400, 'INVENTORY.INVENTORY_IMPORT_BAD_HEADERS');
      })
      .catch(helpers.handler);
  });
});
