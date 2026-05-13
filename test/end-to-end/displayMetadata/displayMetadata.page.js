const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

/**
 * This class is represents a Survey Form page in term of structure and
 * behaviour so it is a Survey Form Management page object
 */

class DisplayMetadataManagementPage {

  constructor(gridId, grid) {
    this.gridId = gridId;
    this.dataGrid = grid;
    this.actionLinkColumn = 8;
  }

  /**
   * Emulate an async constructor
   * @returns {DisplayMetadataManagementPage} a new DisplayMetadataManagementPage object
   */
  static async new() {
    const gridId = 'display-metadata-grid';
    const grid = await TU.locator(by.id(gridId));
    return new DisplayMetadataManagementPage(gridId, grid);
  }

  /**
   * Update the metadata in a survey
   * @param {string} structure - which one to update
   * @param {object} surveyData - data for the update
   */
  async updateMetadata(structure, surveyData) {
    const row = new GridRow(structure);
    await row.dropdown();
    await row.edit();

    await TU.locator('[name="label"]').fill(surveyData.label);
    await TU.locator('[name="longueur"]').fill(surveyData.longueur);
    await TU.locator('[name="largeur"]').fill(surveyData.largeur);
    await TU.locator('[name="nombre_agent"]').fill(surveyData.nombre_agent);
    await TU.locator('[name="nombre_femme"]').fill(surveyData.nombre_femme);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Delete a survey
   * @param {object} dataDelete - data for deletion
   */
  async deleteDataSurvey(dataDelete) {
    const row = new GridRow(dataDelete.label);
    await row.dropdown();
    await row.remove();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }
}

module.exports = DisplayMetadataManagementPage;
