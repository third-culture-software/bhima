const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');

/**
 * This class is represents a indicators_files page in term of structure and
 * behaviour so it is a indicators_files page object
 *
 */

class IndicatorsFilesPage {

  constructor(gridId, grid) {
    this.gridId = gridId;
    this.indicatorsFilesGrid = grid;
  }

  /**
   * Emulate an async constructor
   * @returns {IndicatorsFilesPage} a new IndicatorsFilesPage object
   */
  static async new() {
    const gridId = 'indicators-files';
    const grid = await TU.locator(by.id(gridId));
    return new IndicatorsFilesPage(gridId, grid);
  }

  /**
   * send back the number of indicators_filess in the grid
   * @param number
   */
  expectNumberOfGridRows(number) {
    return GU.expectRowCount(
      this.gridId, number,
      `Expected IndicatorsFiles Registry's ui-grid row count to be ${number}.`);
  }

  /**
   * create hospitalization indicators files
   * @param fiscalYear
   * @param period
   * @param indicators
   * @param service
   */
  async createHospitalizationIndicatorsFiles(fiscalYear, period, indicators, service) {
    // click add and choose hospitalization
    await this.openNewFile('hospital');

    // set fiscal year and period
    await components.fiscalYearPeriodSelect.set(fiscalYear, period);

    // set the service
    await components.serviceSelect.set(service);

    // set indicators variables
    await components.inputText.set('total_day_realized', indicators.total_day_realized);
    await components.inputText.set('total_beds', indicators.total_beds);
    await components.inputText.set('total_hospitalized_patient', indicators.total_hospitalized_patient);
    await components.inputText.set('total_death', indicators.total_death);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * create staff indicators files
   * @param fiscalYear
   * @param period
   * @param indicators
   */
  async createStaffIndicatorsFiles(fiscalYear, period, indicators) {
    await this.openNewFile('staff');
    // set fiscal year and period
    await components.fiscalYearPeriodSelect.set(fiscalYear, period);
    // set indicators variables
    await components.inputText.set('total_doctors', indicators.total_doctors);
    await components.inputText.set('total_nurses', indicators.total_nurses);
    await components.inputText.set('total_caregivers', indicators.total_caregivers);
    await components.inputText.set('total_staff', indicators.total_staff);
    await components.inputText.set('total_surgery_by_doctor', indicators.total_surgery_by_doctor);
    await components.inputText.set('total_visit', indicators.total_visit);
    await components.inputText.set('total_external_visit', indicators.total_external_visit);
    await components.inputText.set('total_hospitalized_patient', indicators.total_hospitalized_patient);
    await components.inputText.set('total_day_realized', indicators.total_day_realized);
    // submit
    await TU.buttons.submit();
    // check notification success
    await components.notification.hasSuccess();
  }

  /**
   * create finance indicators files
   * @param fiscalYear
   * @param period
   * @param indicators
   */
  async createFinanceIndicatorsFiles(fiscalYear, period, indicators) {
    await this.openNewFile('finance');
    // set fiscal year and period
    await components.fiscalYearPeriodSelect.set(fiscalYear, period);
    // set indicators variables
    await components.inputText.set('total_revenue', indicators.total_revenue);
    await components.inputText.set('total_subsidies', indicators.total_subsidies);
    await components.inputText.set('total_drugs_sale', indicators.total_drugs_sale);
    await components.inputText.set('total_expenses', indicators.total_expenses);
    await components.inputText.set('total_other_charge', indicators.total_other_charge);
    await components.inputText.set('total_drugs_purchased', indicators.total_drugs_purchased);
    await components.inputText.set('total_staff_charge', indicators.total_staff_charge);
    await components.inputText.set('total_operating_charge', indicators.total_operating_charge);
    await components.inputText.set('total_depreciation', indicators.total_depreciation);
    await components.inputText.set('total_debts', indicators.total_debts);
    await components.inputText.set('total_cash', indicators.total_cash);
    await components.inputText.set('total_stock_value', indicators.total_stock_value);
    await components.inputText.set('total_staff', indicators.total_staff);

    await TU.buttons.submit();

    await components.notification.hasSuccess();
  }

  async openNewFile(key) {
    const map = {
      hospital : '[data-method="add-hospitalization"]',
      staff : '[data-method="add-staff"]',
      finance : '[data-method="add-finance"]',
    };

    // open the dropdown menu
    await TU.locator('[data-action="open-files-types"]').click();

    // click
    return TU.locator(`${map[key]}`).click();
  }

  /**
   * search
   * @param options
   */
  async search(options) {
    await TU.buttons.search();

    // set to default values the form
    await this.reset();

    if (options.fiscalYear && options.period) {
      await components.fiscalYearPeriodSelect.set(options.fiscalYear, options.period);
    }

    if (options.service) {
      await components.serviceSelect.set(options.service);
    }

    if (options.type) {
      await TU.uiSelect('$ctrl.searchQuery.type_id', options.type);
    }

    if (options.status) {
      await TU.uiSelect('$ctrl.searchQuery.status_id', options.status);
    }

    if (options.user) {
      await components.userSelect.set(options.user);
    }

    await TU.buttons.submit();
  }

  /**
   * reset
   */
  async reset() {
    const clearButtons = await (await TU.locator('[data-reset-input]')).all();
    // start clean from the bottom to the top
    // because if the clean start from the top and arrive in the bottom, top elements
    // are not visible
    for (let i = clearButtons.length - 1; i >= 0; i--) {
      const clearBtn = clearButtons[i];
       
      await clearBtn.click();
    }
  }
}

module.exports = IndicatorsFilesPage;
