const TU = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

class HolidayPage {
  constructor(modal) {
    this.modal = modal;
  }

  /**
   * Emulate an async constructor
   * @returns {HolidayPage} a new HolidayPage object
   */
  static async new() {
    const modal = await TU.locator('[uib-modal-window]');
    return new HolidayPage(modal);
  }

  /**
   * simulate the create holiday button click to show the dialog of creation
   * @param holiday
   */
  async create(holiday) {
    await TU.buttons.create();
    await components.employeeSelect.set('Employee Test 1');
    await TU.input('HolidayModalCtrl.holiday.label', holiday.label);
    await TU.input('HolidayModalCtrl.holiday.percentage', holiday.percentage);
    await components.dateInterval.range(holiday.dateFrom, holiday.dateTo);
    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Prevent the definition of a nested vacation period
   * @param holiday
   */
  async preventHoliday(holiday) {
    await TU.buttons.create();
    await components.employeeSelect.set('Employee Test 1');
    await TU.input('HolidayModalCtrl.holiday.label', holiday.label, this.modal);
    await TU.input('HolidayModalCtrl.holiday.percentage', holiday.percentage, this.modal);
    await components.dateInterval.range(holiday.dateFrom, holiday.dateTo);
    await TU.modal.submit();
    await TU.buttons.cancel();
    await components.notification.hasError();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreateHoliday() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('HolidayModalCtrl.holiday.label');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a function
   * @param label
   * @param updateHoliday
   */
  async update(label, updateHoliday) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.input('HolidayModalCtrl.holiday.label', updateHoliday.label, this.modal);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  async remove(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();
    await TU.modal.submit();
    await components.notification.hasSuccess();
  }
}

module.exports = HolidayPage;
