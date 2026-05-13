const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const InventoryAdjustment = require('./stock.adjustment.page');
const StockInventoriesRegistryTests = require('./stock.z2.inventory-adjustment-inventories');
const StockLotsRegistryTests = require('./stock.z3.inventory-adjustment-lots');

/**
 *
 */
function StockInventoryAdjustmentTests() {
  const DEPOT_PRINCIPAL = 'Depot Principal';
  const DESCRIPTION = 'Ajustement des articles en stock complet';

  // the page object
  const page = new InventoryAdjustment();

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/stock/inventory-adjustment');
  });

  test(`Should select the ${DEPOT_PRINCIPAL}`, async () => {
    await TU.waitForSelector('h3:has-text("Stock Inventory Adjustment"), li.title:has-text("Depot Selection")');
    return page.setDepot(DEPOT_PRINCIPAL);
  });

  test('Should make inventory adjustment correctly', async () => {
    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION);

    // set all other to zero
    for (let i = 0; i < 5; i++) {
       
      await page.setQuantity(i, 5, 0);
    }

    // set the Vitamines B1+B6+B12 to 23
    await page.setQuantity(2, 5, 23);

    // set the Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité to 17
    await page.setQuantity(5, 5, 17);

    // submit
    await page.submit();
  });

}

module.exports = () => {
  test.describe('Inventory Adjustment Test', StockInventoryAdjustmentTests);
  test.describe('Inventory Registry After Adjustment', StockInventoriesRegistryTests);
  test.describe('Lots Registry After Adjustment', StockLotsRegistryTests);
};
