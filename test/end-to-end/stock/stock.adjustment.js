const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const ExitAdjustment = require('./stock.adjustment.page');

/**
 *
 */
function StockAdjustmentTests() {
  const DEPOT_PRINCIPAL = 'Depot Principal';
  // const DESCRIPTION = 'Ajustement de stock';

  // the page object
  const page = new ExitAdjustment();

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/stock/adjustment');
  });

  test(`Should select the ${DEPOT_PRINCIPAL}`, () => {
    return page.setDepot(DEPOT_PRINCIPAL);
  });

  // test('Should make a positive adjustment ', async () => {
  //   // select the positive adjustment
  //   await page.setAdjustment('increase');

  //   await page.setDate(new Date());

  //   await page.setDescription(DESCRIPTION.concat(' - Positive'));

  //   await page.addRows(1);

  //   // increase the QUININE-A for 20
  //   await page.setItem(0, 'Quinine', 'QUININE-A', 20);

  //   // submit
  //   await page.submit();
  // });

  // test('Should make a negative adjustment ', async () => {
  //   // select the negative adjustment
  //   await page.setAdjustment('decrease');

  //   await page.setDate(new Date());

  //   await page.setDescription(DESCRIPTION.concat(' - Negative'));

  //   await page.addRows(1);

  //   // increase the QUININE-A for 20
  //   await page.setItem(0, 'Quinine', 'QUININE-A', 20);

  //   // submit
  //   await page.submit();
  // });

}

module.exports = StockAdjustmentTests;
