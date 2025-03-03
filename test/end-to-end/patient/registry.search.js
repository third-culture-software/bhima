const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const Filters = require('../shared/components/bhFilters');
const SearchModal = require('../shared/search.page');
const components = require('../shared/components');
const GU = require('../shared/GridUtils');

function PatientRegistrySearch() {
  let modal;
  let filters;

  const parameters = {
    patientGroup : 'Test Patient Group 2',
    name : 'Mock',
    name1 : 'Patient',
    dateRegistrationFrom : '01/01/2015',
    dateRegistrationTo : '01/04/2015',
    dateBirthFrom : '01/05/2016',
    dateBirthTo : '16/05/2016',
    dateBirthFrom2 : '30/01/1960',
    dateBirthTo2 : '16/05/2016',
    originVillageName : 'Gombe',
  };

  // @TODO - Figure out why some tests produce different numbers of rows in the grid
  //         arbitrarily.  See if the list of acceptable numbers can be eliminated.

  async function getRows() {
    return TU.locator(by.id('patient-registry'))
      .locator('.ui-grid-render-container-body')
      .locator(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index')).all();
  }

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    TU.registerPage(page);
    await TU.login();
  });

  test.beforeEach(async () => {
    const path = '/#!/patients';
    await TU.navigate(path);
    modal = new SearchModal('patient-search', path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  async function expectNumberOfGridRows(number) {
    const rows = await getRows();
    if (Array.isArray(number)) {
      expect(new Set(number),
        `Expected Patient Registry ui-grid's row count to be in ${number}.`).toContain(rows.length);
    } else {
      expect(rows.length,
        `Expected Patient Registry ui-grid's row count to be ${number}.`).toBe(number);
    }
  }

  test('grid should have 3, 4, or 5 visible rows', async () => {
    // @TODO : fix to eliminate problems with parallel execution of patient and employees tests
    const DEFAULT_PATIENTS_FOR_TODAY = [3, 4, 5];
    await filters.resetFilters();
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('today');
    await modal.submit();

    await expectNumberOfGridRows(DEFAULT_PATIENTS_FOR_TODAY);
  });

  // demonstrates that filtering works
  test(`should find one patient with name "${parameters.name}"`, async () => {
    const NUM_MATCHING = 1;
    await TU.input('$ctrl.searchQueries.display_name', parameters.name);
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`should find patients with Debtor Group "NGO IMA World Health"`, async () => {
    // @TODO : Rework tests so that this is always 1 value
    const NUM_MATCHING = [1, 2, 3];

    await components.debtorGroupSelect.set('NGO IMA World Health');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  // demonstrates additive filters
  test(`should find three "male" patients with name "${parameters.name1}"`, async () => {
    const NUM_MATCHING = 3;
    await TU.input('$ctrl.searchQueries.display_name', parameters.name1);
    await TU.locator(by.id('male')).click();
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  // demonstrates that additive + time-delimited filtering works
  test(`should find no patients with name "${parameters.name1}" registered in the last week`, async () => {
    const NUM_MATCHING = 0;
    await TU.input('$ctrl.searchQueries.display_name', parameters.name1);
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('lastWeek');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`should find two patient with patient group "${parameters.patientGroup}" registered in allTime`, async () => {
    const NUM_MATCHING = 2;
    await components.patientGroupSelect.set(parameters.patientGroup);
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`should find patients with origin location "${parameters.originVillageName}" `, async () => {
    // @TODO : Rework tests so that this is always 1 value
    const NUM_MATCHING = [21, 22, 23];
    await TU.input('$ctrl.searchQueries.originLocationLabel', parameters.originVillageName);
    await TU.modal.submit();
    await expectNumberOfGridRows(NUM_MATCHING);
  });

  // demonstrates that sex + time-delimited filtering works
  test('should find one female patients registered in the last year.', async () => {
    // @TODO : Rework tests so that this is always 1 value
    const NUM_MATCHING = [0, 1];
    await TU.locator(by.id('female')).click();
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('lastYear');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  // changes every single date input manually.
  test('should find 6 or 7 patients with complex limited dates.', async () => {
    // @TODO : Rework tests so that this is always 1 value
    const NUM_MATCHING = [21, 22, 23];
    await components.dateInterval.range(parameters.dateBirthFrom2, parameters.dateBirthTo2, 'dob-date');
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  // clears filters to assert that the "error state" bug does not occur when the
  // cancel button is clicked
  test('clearing filters restores default number of rows to the grid', async () => {
    // @TODO : Rework tests so that this is always 1 value
    const NUM_MATCHING = [21, 22, 23];
    await TU.locator(by.id('male')).click();
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test('should remember the cached filters', async () => {
    const NUM_MATCHING = 0;
    await TU.locator(by.id('male')).click();
    await TU.input('$ctrl.searchQueries.display_name', 'Some Non-Existant Patient');
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('year');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test('bulk group assignment without selecting patients warns the user', async () => {
    await TU.modal.cancel();
    await TU.locator(by.id('menu')).click();
    await TU.locator('[data-method="change-patient-group"]').click();
    await components.notification.hasWarn();
  });

  test('changes the patient group for multiple patients', async () => {
    // Close the open search modal (from beforeEach)
    await TU.modal.cancel();

    const gridId = 'patient-registry';
    await GU.selectRow(gridId, 0);
    await GU.selectRow(gridId, 1);

    await TU.locator(by.id('menu')).click();
    await TU.locator('[data-method="change-patient-group"]').click();

    const group1 = '0B8FCC008640479D872A31D36361FCFD'; // Test Patient Group 1
    const group2 = '112A9FB5847D4C6A9B20710FA8B4DA22'; // Test Patient Group 2

    // Wait for the change group dialog to appear
    await TU.waitForSelector('[data-modal="patient-edit-group"]');

    // Not sure why by.id() does not work in the next two checkbox
    await TU.locator(`[data-modal="patient-edit-group"] [id="${group1}"]`).check();
    await TU.locator(`[data-modal="patient-edit-group"] [id="${group2}"]`).check();

    // Make sure we close the correct modal
    await TU.locator('[data-modal="patient-edit-group"] [data-method="submit"]').click();
    await components.notification.hasSuccess();

    // deselect groups
    await GU.selectRow(gridId, 0);
    await GU.selectRow(gridId, 1);
  });

}

module.exports = PatientRegistrySearch;
