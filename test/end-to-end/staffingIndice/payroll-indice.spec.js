const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const components = require('../shared/components');
const Search = require('../payrollProcess/searchModal.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

const searchModalPage = new Search();
test.describe('Multipayroll (indice)', () => {

  const path = '/#!/multiple_payroll_indice';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const conf1 = {
    display_name : 'TEST 2 PATIENT',
  };

  const conf2 = {
    display_name : 'EMPLOYEE TEST 1',
  };

  const defaultValue = {
    period      : 'Juin 2019',
    currency    : 2,
  };

  test(`should search period`, async () => {
    await searchModalPage.payrollPeriod(defaultValue.period);
    await searchModalPage.selectCurrency(defaultValue.currency);
    await searchModalPage.submit();
  });

  test(`should a config Staffing indice for ${conf1.display_name}`, async () => {
    const menu = await openDropdownMenu(conf1.display_name);
    await menu.edit();
    await components.inputText.set('ConfigPaiementForm_JR_PRS', 26);
    await components.inputText.set('ConfigPaiementForm_jr_Suppl', 2);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test(`should a config Staffing indice for ${conf2.display_name}`, async () => {
    const menu = await openDropdownMenu(conf2.display_name);
    await menu.edit();
    await components.inputText.set('ConfigPaiementForm_JR_PRS', 23);
    await components.inputText.set('ConfigPaiementForm_jr_Suppl', 0);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  // @TODO: Fix.  Works alone but fails with other tests
  test.skip(`should set the enveloppe salarial`, async () => {
    await TU.waitForSelector('[data-action="open-menu"]');
    await TU.locator('[data-action="open-menu"]').click();
    await TU.locator('[data-method="configure-payment"]').click();
    await searchModalPage.payrollPeriod(defaultValue.period);

    await components.currencyInput.set(100000, 'enveloppe_salarial');
    await components.inputText.set('working_days', 26);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  async function openDropdownMenu(label) {
    // Make sure the grid is loaded
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');
    const row = new GridRow(label);
    await row.dropdown();
    return row;
  }

});
