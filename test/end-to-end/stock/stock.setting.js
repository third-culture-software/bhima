const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const EntryPage = require('./stock.setting.page');

/**
 *
 */
function StockSettingTests() {
  // the page object
  const page = new EntryPage();

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/stock/setting');
  });

  test('Should Update Stock Setting', async () => {
    await page.defineMonthAverageConsumption(5);
    await page.defaultMinMonthsSecurityStock(4);
    await page.defineDefaultPurchaseInterval(2);

    await page.setRadio('yes', 'enable_auto_purchase_order_confirmation');
    await page.setRadio('yes', 'enable_strict_depot_permission');
    await page.setRadio('yes', 'enable_auto_stock_accounting');
    await page.setRadio('yes', 'enable_supplier_credit');

    await TU.locator(by.id('algo_msh')).click();
    const checkSelectAlgoDef = await TU.locator(by.id('algo_def'));
    const checkSelectAlgoMsh = await TU.locator(by.id('algo_msh'));

    expect(await checkSelectAlgoDef.isChecked()).toBe(false);
    expect(await checkSelectAlgoMsh.isChecked()).toBe(true);

    // submit
    await TU.buttons.submit();
    await page.checkSuccess();
  });

  test('Should Restore Stock Setting value', async () => {
    await page.defineMonthAverageConsumption(10);
    await page.defaultMinMonthsSecurityStock(2);

    await page.setRadio('no', 'enable_auto_purchase_order_confirmation');
    await page.setRadio('no', 'enable_strict_depot_permission');
    await page.setRadio('no', 'enable_auto_stock_accounting');
    await page.setRadio('no', 'enable_supplier_credit');

    await TU.locator(by.id('algo_def')).click();
    const checkSelectAlgoDef = await TU.locator(by.id('algo_def'));
    const checkSelectAlgoMsh = await TU.locator(by.id('algo_msh'));

    expect(await checkSelectAlgoDef.isChecked()).toBe(true);
    expect(await checkSelectAlgoMsh.isChecked()).toBe(false);

    // submit
    await TU.buttons.submit();
    await page.checkSuccess();
  });

}

module.exports = StockSettingTests;
