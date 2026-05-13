const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

test.describe('Patient Groups', async () => {
  // navigate to the page before running test suite
  test.beforeEach(async () => {
    await TU.navigate('/#!/patients/groups');
  });

  // a new group to create
  const group = {
    name : 'HIV Patients',
    note : `
      These are patients that suffer from HIV and
      benefit from medical discounts.
    `,
  };

  const group2 = {
    name : 'Employee PAX',
    note : `
      This is just for test.
    `,
  };

  test('creates a patient group', async () => {
    await TU.buttons.create();
    // fill in the form details
    await TU.input('ModalCtrl.patientGroup.name', group.name);
    await TU.select('ModalCtrl.patientGroup.price_list_uuid', 'Test Price List');
    await TU.input('ModalCtrl.patientGroup.note', group.note);

    // submit the form
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('creates a second patient group', async () => {
    await TU.buttons.create();
    // fill in the form details
    await TU.input('ModalCtrl.patientGroup.name', group2.name);
    await TU.select('ModalCtrl.patientGroup.price_list_uuid', 'Test Price List');
    await TU.input('ModalCtrl.patientGroup.note', group2.note);

    // submit the form
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('updates a patient group', async () => {

    await editGroup(group.name);
    // change the note
    await TU.input('ModalCtrl.patientGroup.note',
      'I like writing end-to-end tests... They give me so much confidence in the application.');

    // submit the form
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('deletes a patient group', async () => {
    await deleteGroup(group2.name);
    // reject the alert that appears
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  /**
   *
   * @param label
   */
  async function editGroup(label) {
    const row = new GridRow(label);
    await row.dropdown();
    return row.edit();
  }

  /**
   *
   * @param label
   */
  async function deleteGroup(label) {
    const row = new GridRow(label);
    await row.dropdown();
    return row.remove();
  }

});
