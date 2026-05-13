const moment = require('moment');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const EntryPage = require('./stock.entry.page');

/**
 *
 */
function StockEntryTests() {
  const DEPOT_PRINCIPAL = 'Depot Principal';
  const DEPOT_SECONDAIRE = 'Second';
  const DESCRIPTION = 'Entree de stock';

  const expireInOneYear = moment().add(1, 'year').format('YYYY-MM-DD');
  const expireInTwoYears = moment().add(2, 'year').format('YYYY-MM-DD');
  const expireInThreeYears = moment().add(3, 'year').format('YYYY-MM-DD');

  // the page object
  const page = new EntryPage();

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/stock/entry');
  });

  test(`Should select the ${DEPOT_PRINCIPAL}`, async () => {
    // Give the page a chance to load
    await TU.waitForSelector('form[name="StockEntryForm"]');
    await page.setDepot(DEPOT_PRINCIPAL);
  });

  test('Should enter stock from a purchase order', async () => {
    // select the purchase order
    await page.setPurchase(0);

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Purchase order'));

    const lots = [
      { label : 'LX-ONE', quantity : 500, expiration_date : expireInThreeYears },
      { label : 'LX-TWO', quantity : 300, expiration_date : expireInTwoYears },
      { label : 'LX-THREE', quantity : 200, expiration_date : expireInOneYear },
    ];
    const globalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);

    await page.setLots(0, lots, false, globalQuantity);

    // submit
    await page.submit();
  });

  test(`Should enter stock in ${DEPOT_SECONDAIRE} from an integration`, async () => {

    // set another Depot
    await TU.waitForSelector('form[name="StockEntryForm"]');
    await page.setDepot(DEPOT_SECONDAIRE);

    // select the integration option
    await page.setIntegration();

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Integration de stock'));

    await page.addRows(1);

    const lots = [
      { label : 'ASP-ONE', quantity : 100, expiration_date : expireInThreeYears },
      { label : 'ASP-TWO', quantity : 200, expiration_date : expireInTwoYears },
      { label : 'ASP-THREE', quantity : 300, expiration_date : expireInOneYear },
      { label : 'ASP-FOUR', quantity : 400, expiration_date : expireInOneYear },
      { label : 'ASP-FIVE', quantity : 500, expiration_date : expireInThreeYears },
    ];

    await page.setItem(0, 'DORA_QUIN1S-_0'); // Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité

    await page.setLots(0, lots, false, 1500, 0.09);

    // submit
    await page.submit();
  });

  test('Should enter stock from a transfer reception', async () => {
    // set another Depot
    await page.setDepot(DEPOT_SECONDAIRE);

    // select the movement
    await page.setTransfer(0);

    // Wait for the transfer selection dialog to close
    await TU.waitForSelector('textarea[name="description"]:visible');

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Transfer reception'));

    const lots = [
      { quantity : 75 },
    ];

    await page.setLots(0, lots, true, null);

    // Wait for the dialog to disappear
    await expect(TU.locator('.modal-dialog')).toHaveCount(0);

    // submit
    await page.submit();
  });

  // @TODO Fix this: enabling fast lots insert does not seem to be working in the test
  test.skip('Should add automatically new lot row when fast insert is enabled', async () => {

    // set another Depot
    await page.setDepot(DEPOT_SECONDAIRE);

    // select the integration option
    await page.setIntegration();

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Integration de stock'));

    await page.addRows(1);

    await page.setItem(0, 'DORA_QUIN1S-_0'); // Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité

    await page.openLotsModal(0);

    await page.enableFastLotsInsert();

    const lots = ['AAA', 'BBB', 'CCC'];
    await page.fastLotsInsert(lots);
  });

}

module.exports = StockEntryTests;
