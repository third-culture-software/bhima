const TU = require('../shared/TestUtils');
const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

/**
 * This class is represents a offday page in term of structure and
 * behaviour so it is a offday page object
 */

class OffdayPage {

  /**
   * simulate the create offday button click to show the dialog of creation
   * @param offday
   */
  async createOffday(offday) {
    await TU.buttons.create();
    await TU.input('OffdayModalCtrl.offday.label', offday.label);

    await components.dateEditor.set(offday.date, 'offday-date-editor', '.modal li.title');

    await TU.input('OffdayModalCtrl.offday.percent_pay', offday.percent_pay);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreateOffday() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('OffdayModalCtrl.offday.label');
    await TU.buttons.cancel();
  }

  async openDropdownMenu(label) {
    const row = new GridRow(label);
    await row.dropdown();
    return row;
  }

  /**
   * simulate a click on the edit link of a function
   * @param label
   * @param updateOffday
   */
  async editOffday(label, updateOffday) {
    const row = await this.openDropdownMenu(label);
    await row.edit();

    await TU.input('OffdayModalCtrl.offday.label', updateOffday.label);

    await components.dateEditor.set(updateOffday.date, 'offday-date-editor', '.modal li.title');

    await TU.input('OffdayModalCtrl.offday.percent_pay', updateOffday.percent_pay);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a function
   * @param label
   */
  async deleteOffday(label) {
    const row = await this.openDropdownMenu(label);
    await row.remove();

    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }
}

module.exports = OffdayPage;
