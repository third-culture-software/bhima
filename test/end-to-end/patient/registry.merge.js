const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const components = require('../shared/components');
const MergePatientPage = require('./registry.merge.page');

/**
 *
 */
function MergePatientTest() {

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    TU.registerPage(page);
    await TU.login();
  });

  test.beforeEach(async () => {
    await TU.navigate('patients');
  });

  const page = new MergePatientPage();

  test('forbid selection of more than two patients', async () => {
    await page.gridSelectRows(1, 2, 3);
    await page.openMergeTool();
    await components.notification.hasWarn();

    // unselect all patients
    await page.gridSelectRows(1, 2, 3);
  });

  test('successfully merge two selected patients into one', async () => {
    const reference = 'PA.TPA.2';
    await page.gridSelectRows(2, 3);
    await page.openMergeTool();
    await TU.waitForSelector('.modal-dialog .modal-footer');

    // See if we are requesting a bad merge (of employees)
    const mergeable = await TU.getByRole('heading').innerText();
    const badMerge = mergeable === 'Merge of employees not allowed';

    if (badMerge) {
      // Skip the test if other tests have changed the patients to employees
      // @todo:  Refactor to create new employees to merge
    } else {
      await page.selectPatientToKeep(reference);
      await page.merge();
      await components.notification.hasSuccess();
    }
  });
}

module.exports = MergePatientTest;
