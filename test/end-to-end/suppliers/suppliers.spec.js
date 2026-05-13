const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const components = require('../shared/components');
const GridRow = require('../shared/GridRow');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Suppliers', () => {
  const path = '/#!/suppliers';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const supplier = {
    display_name : 'Alpha Lmtd',
    address_1    : '45 Street Blvd',
    address_2    : '30 june Blvd',
    email        : 'info@alpha.cd',
    fax          : '12-34-294-10',
    note         : 'Commentaire speciale',
    phone        : '025495950001',
  };

  test('creates a new supplier', async () => {
    await TU.buttons.create();
    await components.inputText.set('display_name', supplier.display_name);

    await TU.locator(by.model('ModalCtrl.supplier.international')).click();

    // select an Creditor
    await TU.select('ModalCtrl.supplier.creditor_group_uuid', 'Regideso');

    await components.inputText.set('phone', supplier.phone);
    await components.inputText.set('email', supplier.email);
    await components.inputText.set('address_1', supplier.address_1);
    await components.inputText.set('address_2', supplier.address_2);
    await components.inputText.set('fax', supplier.fax);
    await TU.input('ModalCtrl.supplier.note', supplier.note);

    // submit the page to the server
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('edits a supplier', async () => {
    await editSupplier(supplier.display_name);

    // modify the supplier display_name
    await components.inputText.set('display_name', 'Updated');

    // modify the supplier note
    await TU.input('ModalCtrl.supplier.note', ' IMCK Tshikaji update for the test E2E');
    await components.inputText.set('address_1', supplier.address_1);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('blocks invalid form submission with relevant error classes', async () => {
    await TU.buttons.create();

    // verify form has not been submitted
    await TU.buttons.submit();
    expect(await TU.getCurrentPath()).toBe(path);

    // the following fields should be required
    await components.inputText.validationError('display_name');
    await TU.validation.error('ModalCtrl.supplier.creditor_group_uuid');
    await components.inputText.validationError('address_1');

    // the following fields are not required
    await components.inputText.validationError('phone');
    await components.inputText.validationError('email');

    // optional
    await components.inputText.validationOk('address_2');
    await components.inputText.validationOk('fax');
    await TU.validation.ok('ModalCtrl.supplier.note');
    await TU.buttons.cancel();
    await components.notification.hasDanger();
  });

  /**
   *
   * @param label
   */
  async function openDropdownMenu(label) {
    const row = new GridRow(label);
    await row.dropdown();
    return row;
  }

  /**
   *
   * @param name
   */
  async function editSupplier(name) {
    const row = await openDropdownMenu(name);
    await row.edit();
  }
});
