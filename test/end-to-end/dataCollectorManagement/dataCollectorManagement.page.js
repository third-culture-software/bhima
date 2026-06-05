/**
 * This class represents a Data Collector page in term of structure and
 * behaviour so it is a Data Collector Management page object
 */

const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

/* loading grid actions */
const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

const gridId = 'data-collector-management-grid';

class DataCollectorManagementPage {

  /**
   * Constructor
   * @param {object} grid - the GridRows object
   */
  constructor(grid) {
    this.gridId = gridId;
    this.actionLinkColumn = 5;
    this.rubricGrid = grid;
  }

  /**
   * Emulate an async constructor
   * @returns {DataCollectorManagementPage} a new ConfigurationAnalysisToolsPage object
   */
  static async new() {
    const rubricGrid = await TU.locator(by.id(gridId));
    return new DataCollectorManagementPage(rubricGrid);
  }

  /**
   * Create a new data collector object
   * @param {object} dataCollectorManagement - info for the new data collector object
   */
  async create(dataCollectorManagement) {
    await TU.buttons.create();
    await TU.input('DataCollectorManagementModalCtrl.dataCollector.label', dataCollectorManagement.label);
    await TU.input('DataCollectorManagementModalCtrl.dataCollector.description',
      dataCollectorManagement.description, this.modal);
    await TU.input('DataCollectorManagementModalCtrl.dataCollector.version_number',
      dataCollectorManagement.version_number, this.modal);
    await TU.uiSelect('DataCollectorManagementModalCtrl.dataCollector.color', dataCollectorManagement.color);
    await TU.locator(by.id('is_related_patient')).click();
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreate() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('DataCollectorManagementModalCtrl.dataCollector.label');
    await TU.buttons.cancel();
  }

  /**
   * Edit a data collector object
   * @param {string} label - label for data collector object to edit
   * @param {object} updateDataCollector - data for updating
   */
  async edit(label, updateDataCollector) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.input('DataCollectorManagementModalCtrl.dataCollector.label', updateDataCollector.label);
    await TU.input('DataCollectorManagementModalCtrl.dataCollector.version_number', updateDataCollector.version_number);
    await TU.uiSelect('DataCollectorManagementModalCtrl.dataCollector.color', updateDataCollector.color);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Delete an data collector object
   * @param {string} label - label for the data collector object to delete
   */
  async delete(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }
}

module.exports = DataCollectorManagementPage;
