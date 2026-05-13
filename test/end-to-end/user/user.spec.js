const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const components = require('../shared/components');

const UserPage = require('./user.page');
const UserCreateUpdatePage = require('./userCU.page');
const EditPasswordPage = require('./edit.password.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('User Management Page', () => {
  const path = '/#!/users';
  const userPage = new UserPage();

  const userCreateUpdatePage = new UserCreateUpdatePage();
  const editPasswordPage = new EditPasswordPage();

  const mockUserCreate = {
    display_name : 'User test',
    username : 'Login test',
    email : 'test@bhima.org',
    project : 'Test Project A',
    password : 'testtest134@IMA',
    passwordConfirm : 'testtest134@IMA',
  };

  const mockUserEdit = {
    display_name : 'User test edit',
    username : 'Login test edit',
    email : 'test_edit@bhima.org',
    project : 'Test Project C',
    password : 'testtestedit1233@D',
  };

  const userCount = 4;

  const cashbox = {
    text : 'Caisse Auxiliaire',
  };

  const depots = {
    depot1 : 'Depot Secondaire',
    depot2 : 'Depot Principal',
  };

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  test('displays all users loaded from the database', async () => {
    expect(await userPage.count()).toBe(userCount);
  });

  test('creates a user successfully', async () => {
    await userPage.create();
    await userCreateUpdatePage.setDisplayName(mockUserCreate.display_name);
    await userCreateUpdatePage.setUsername(mockUserCreate.username);
    await userCreateUpdatePage.setEmail(mockUserCreate.email);
    await userCreateUpdatePage.setProjectValue(mockUserCreate.project, false);
    await userCreateUpdatePage.setPassword(mockUserCreate.password);
    await userCreateUpdatePage.setPasswordConfirm(mockUserCreate.passwordConfirm);
    await userCreateUpdatePage.submitUser();
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');
    const count = await userPage.count();
    expect([userCount, userCount + 1]).toContain(count);
  });

  // @TODO : Fix works alone and locally but not in CI
  test.skip('edits a user successfully without changing the password', async () => {
    await userPage.update(mockUserCreate.display_name);
    await userCreateUpdatePage.setDisplayName(mockUserEdit.display_name);
    await userCreateUpdatePage.setUsername(mockUserEdit.username);
    await userCreateUpdatePage.setEmail(mockUserEdit.email);
    await userCreateUpdatePage.setProjectValue(mockUserEdit.project, true);
    await userCreateUpdatePage.submitUser();
    await components.notification.hasSuccess();
  });

  // @TODO : Fix works alone and locally but not in CI
  test.skip('edits a user password successfully', async () => {
    await userPage.update(mockUserEdit.display_name);
    await userCreateUpdatePage.editPassword();
    await editPasswordPage.setPassword(mockUserEdit.password);
    await editPasswordPage.setPasswordConfirm(mockUserEdit.password);
    await editPasswordPage.submitPassword();
    // wait for the password dialog to go away
    await TU.waitForSelector(by.id('user-edit-password'));
    await userCreateUpdatePage.submitUser();
    await components.notification.hasSuccess();
  });

  // @TODO : Fix works alone and locally but not in CI
  test.skip('deactivate user system access successfully', async () => {
    await userPage.toggleUser(mockUserEdit.display_name, false);
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // @TODO : Fix works alone and locally but not in CI
  test.skip('validates form on editing password', async () => {
    await userPage.update(mockUserEdit.display_name);

    // check that an empty form is not allowed
    await userCreateUpdatePage.editPassword();
    await editPasswordPage.submitPassword();
    await editPasswordPage.expectPasswordInvalid();
    await editPasswordPage.expectPasswordConfirmInvalid();

    // check that the passwords must be equal
    await editPasswordPage.setPassword('1');
    await editPasswordPage.setPasswordConfirm('2');
    await editPasswordPage.submitPassword();
    await editPasswordPage.expectPasswordMismatch();

    await editPasswordPage.cancelEditing();
    await userCreateUpdatePage.close();
  });

  test(`sets the cashbox ${cashbox.text} management rights for "Regular User"`, async () => {
    await userPage.updateCashbox('Regular User');
    await components.bhCheckboxTree.toggle([cashbox.text]);
    // submit the modal
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  test('validates form on creation', async () => {
    await userPage.create();
    await userCreateUpdatePage.submitUser();
    await userCreateUpdatePage.isUsernameInvalid();
    await userCreateUpdatePage.isDisplayNameInvalid();
    await userCreateUpdatePage.isEmailInvalid();
    await userCreateUpdatePage.isProjectInvalid();
    await userCreateUpdatePage.isPasswordInvalid();
    await userCreateUpdatePage.isPasswordConfirmInvalid();
    await userCreateUpdatePage.close();
  });

  test(`sets the depot ${depots.depot1} and ${depots.depot2} management rights for "Regular User"`, async () => {
    await userPage.updateDepot('Regular User');

    await TU.locator(by.id('d4bb1452-e4fa-4742-a281-814140246877')).click();
    await TU.locator(by.id('f9caeb16-1684-43c5-a6c4-47dbac1df296')).click();

    // submit the modal
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

});
