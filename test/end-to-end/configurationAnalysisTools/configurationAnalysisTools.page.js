const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const { notification } = require('../shared/components');
const components = require('../shared/components');

class ConfigurationAnalysisToolsPage {
  /**
   * Constructor
   * @param {object} modal - the grid modal object
   */
  constructor(modal) {
    this.gridId = 'configuration-analysis-tools-grid';
    this.modal = modal;
  }

  /**
   * Emulate an async constructor
   * @returns {ConfigurationAnalysisToolsPage} a new ConfigurationAnalysisToolsPage object
   */
  static async new() {
    const modal = await TU.locator('[uib-modal-window]');
    return new ConfigurationAnalysisToolsPage(modal);
  }

  /**
   * Get the number of rows in the grid
   * @returns {number} the number of rows in the grid
   */
  async count() {
    const rows1 = await TU.locator(`#${this.gridId} .ui-grid-render-container-body`);
    await rows1.count(); // Hack: should not be necessary, but fails without it
    const rows2 = await rows1.locator(
      by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'));
    await rows2.count(); // Hack: should not be necessary, but fails without it
    const rows = await rows2.all();
    return rows.length;
  }

  /**
   * Create a new configuration
   * @param {object} configuration - the new configuration
   */
  async create(configuration) {
    await TU.buttons.create();
    await TU.input('ConfigurationAnalysisToolsModalCtrl.reference.label', configuration.label, this.modal);
    await components.accountReferenceSelect.set(configuration.account_reference_id, 'account_reference_id');
    await components.analysisToolTypeSelect.set(configuration.analysis_tool_type_id, 'analysis_tool_type_id');
    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async errorOnCreateConfigurationAnalysis() {
    await TU.buttons.create();
    await TU.modal.submit();
    await TU.validation.error('ConfigurationAnalysisToolsModalCtrl.reference.label', this.modal);
    await TU.modal.cancel();
  }

  async update(code, configuration) {
    const row = new GridRow(code);
    await row.dropdown();
    await row.edit();

    await TU.input('ConfigurationAnalysisToolsModalCtrl.reference.label', configuration.label, this.modal);
    await components.accountReferenceSelect.set(configuration.account_reference_id, 'account_reference_id');
    await components.analysisToolTypeSelect.set(configuration.analysis_tool_type_id, 'analysis_tool_type_id');
    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async remove(code) {
    const row = new GridRow(code);
    await row.dropdown();
    await row.remove();

    await TU.modal.submit();
    await notification.hasSuccess();
  }

}

module.exports = ConfigurationAnalysisToolsPage;
