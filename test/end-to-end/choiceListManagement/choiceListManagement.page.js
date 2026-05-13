const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

/**
 * This class is represents a Choice List Management page in term of structure and
 * behavior so it is a Choice List Management page object
 */

/* loading grid actions */
const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

class ChoiceListManagementPage {

  /**
   * Constructor
   * @param {object} grid - new rubricGrid object
   */
  constructor(grid) {
    this.gridId = 'choices-list-management-grid';
    this.actionLinkColumn = 5;
    this.rubricGrid = grid;
  }

  /**
   * Emulate an async constructor
   * @returns {ChoiceListManagementPage} a new ChoiceListManagementPage object
   */
  static async new() {
    const rubricGrid = await TU.locator(by.id(this.gridId));
    return new ChoiceListManagementPage(rubricGrid);
  }

  /**
   * simulate the create Choice list button click to show the dialog of creation
   * @param {object} choiceListElement - a choice list element
   */
  async create(choiceListElement) {
    await TU.buttons.create();
    await TU.input('ChoicesListManagementModalCtrl.choice.label', choiceListElement.label);
    await TU.input('ChoicesListManagementModalCtrl.choice.name', choiceListElement.name);
    await TU.locator(by.id('is_title')).click();
    await TU.locator(by.id('is_group')).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreate() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('ChoicesListManagementModalCtrl.choice.label');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a function
   * @param {string} label - label for the grid row
   * @param {object} updateDataCollector - object with updates
   */
  async edit(label, updateDataCollector) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await components.choiceListSelect.set(updateDataCollector.parent, 'parent');
    await components.choiceListSelect.set(updateDataCollector.group_label, 'group_label');

    await TU.locator(by.id('is_title')).click();
    await TU.locator(by.id('is_group')).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a function
   * @param {string} label - label of row
   */
  async delete(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }
}

module.exports = ChoiceListManagementPage;
