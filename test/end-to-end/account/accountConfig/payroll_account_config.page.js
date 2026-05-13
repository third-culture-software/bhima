const TU = require('../../shared/TestUtils');

/**
 * This class is represents an account configuration page in term of structure and
 * behaviour so it is a account configuration page object
 */

/* loading grid actions */
const { notification, accountSelect, modalAction } = require('../../shared/components');

const GridRow = require('../../shared/GridRow');

class AccountConfigPage {
  constructor() {
    this.gridId = 'account-config-grid';
  }

  /**
   * simulate the create accountConfig button click to show the dialog of creation
   * @param accountConfig
   */
  async createAccountConfig(accountConfig) {
    await TU.buttons.create();
    await TU.input('AccountConfigModalCtrl.accountConfig.label', accountConfig.label);
    await accountSelect.set(accountConfig.account_id);
    await TU.buttons.submit();
    await notification.hasSuccess();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreateAccountConfig() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('AccountConfigModalCtrl.accountConfig.label');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a function
   * @param label
   * @param updateAccountConfig
   */
  async editAccountConfig(label, updateAccountConfig) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.input('AccountConfigModalCtrl.accountConfig.label', updateAccountConfig.label);
    await accountSelect.set(updateAccountConfig.account_id);

    await TU.buttons.submit();
    await notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a function
   * @param label
   */
  async deleteAccountConfig(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();

    await modalAction.confirm();
    await notification.hasSuccess();
  }
}

module.exports = AccountConfigPage;
