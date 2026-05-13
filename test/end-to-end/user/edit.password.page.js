const { expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

/**
 * This class is represents a user password editing page in terms of structure and
 * behaviour so it is a user password editing page object
 */

/**
 *
 */
function EditPasswordPage() {
  const page = this;

  // set a password value
  /**
   *
   * @param pw
   */
  async function setPassword(pw) {
    const password = await TU.locator(by.model('UsersPasswordModalCtrl.user.password'));
    return password.fill(pw);
  }

  // set a password confirmation value
  /**
   *
   * @param pw
   */
  function setPasswordConfirm(pw) {
    const passwordConfirm = TU.locator(by.model('UsersPasswordModalCtrl.user.passwordVerify'));
    return passwordConfirm.fill(pw);
  }

  // submit a user
  /**
   *
   */
  async function submitPassword() {
    const form = await TU.locator('form[name="PasswordForm"]');
    return form.locator('[data-method="submit"]').click();
  }

  // cancel creation
  /**
   *
   */
  async function cancelEditing() {
    const form = await TU.locator('form[name="PasswordForm"]');
    return form.locator('[data-method="cancel"]').click();
  }

  // check if the page is displayed
  /**
   *
   */
  async function isDisplayed() {
    const modal = await TU.locator('[data-edit-password-modal]');
    return modal.isPresent();
  }

  // check if the password field is invalid
  /**
   *
   */
  async function expectPasswordInvalid() {
    const password = await TU.locator(by.model('UsersPasswordModalCtrl.user.password'));
    return isInvalid(password);
  }

  // check if the passwordConfirm field is invalid
  /**
   *
   */
  async function expectPasswordConfirmInvalid() {
    const passwordConfirm = await TU.locator(by.model('UsersPasswordModalCtrl.user.passwordVerify'));
    return isInvalid(passwordConfirm);
  }

  /**
   *
   */
  function expectPasswordMismatch() {
    return TU.isPresent('[data-no-password-match]');
  }

  // check if ng-invalid css class is applied on a component
  /**
   *
   * @param component
   */
  async function isInvalid(component) {
    const classStr = await component.getAttribute('class');
    expect(classStr.includes('ng-invalid'));
    return classStr;
  }

  page.setPassword = setPassword;
  page.setPasswordConfirm = setPasswordConfirm;
  page.submitPassword = submitPassword;
  page.cancelEditing = cancelEditing;
  page.isDisplayed = isDisplayed;
  page.expectPasswordInvalid = expectPasswordInvalid;
  page.expectPasswordConfirmInvalid = expectPasswordConfirmInvalid;
  page.expectPasswordMismatch = expectPasswordMismatch;
}

module.exports = EditPasswordPage;
