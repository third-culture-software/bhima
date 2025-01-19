const TU = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

/**
 * This class is represents a Ipr Tax page in term of structure and
 * behaviour so it is a Ipr Tax page object
 */

class IprTaxConfigPage {

  /**
   * simulate the create Ipr Scale button click to show the dialog of creation
   */
  async createIprTaxConfig(iprTaxConfig) {
    await components.iprScale.set(iprTaxConfig.scale);
    await TU.buttons.create();

    await TU.waitForSelector('.modal-dialog form[name="IprTaxForm"]');

    await TU.input('IprTaxConfigModalCtrl.iprTax.rate', iprTaxConfig.rate);
    await components.currencyInput.set(iprTaxConfig.tranche_annuelle_debut, 'tranche_annuelle_debut');
    await components.currencyInput.set(iprTaxConfig.tranche_annuelle_fin, 'tranche_annuelle_fin');

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreateIprTaxConfig(scale) {
    await components.iprScale.set(scale);
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('IprTaxConfigModalCtrl.iprTax.rate');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a function
   */
  async editIprTaxConfig(rate, updateIprTaxConfig) {
    await components.iprScale.set(updateIprTaxConfig.scale);

    const row = new GridRow(rate);
    await row.dropdown();
    await row.edit();

    await TU.input('IprTaxConfigModalCtrl.iprTax.rate', updateIprTaxConfig.rate);
    await components.currencyInput.set(updateIprTaxConfig.tranche_annuelle_debut, 'tranche_annuelle_debut');
    await components.currencyInput.set(updateIprTaxConfig.tranche_annuelle_fin, 'tranche_annuelle_fin');
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a function
   */
  async deleteIprTaxConfig(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();

    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }
}

module.exports = IprTaxConfigPage;
