const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GA = require('../shared/GridAction');
const GU = require('../shared/GridUtils');
const components = require('../shared/components');

/**
 * This class is represents a Cost Center page in term of structure and
 * behaviour so it is a Cost Center page object
 */

class CostCenterPage {
  constructor() {
    this.gridId = 'cost-center-grid';
    this.actionLinkColumn = 5;
  }

  /**
   * send back the number of Fees Centers in the grid
   */
  async getCostCenterCount() {
    const rubricGrid = await TU.locator(by.id(this.gridId));
    return rubricGrid
      .locator('.ui-grid-render-container-body')
      .locator(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'))
      .count();
  }

  /**
   * simulate the create Cost Center button click to show the dialog of creation
   * @param costCenter
   */
  async createCostCenter(costCenter) {
    await TU.buttons.create();
    await TU.input('CostCenterModalCtrl.costCenter.label', costCenter.label);

    const isPrincipal = (costCenter.is_principal) ? 'principal' : 'auxiliary';
    await TU.locator(by.id(isPrincipal)).click();

    if (costCenter.has_profit_center) {
      await TU.locator(by.id('has_profit_center')).click();
    }

    await components.accountReferenceSelect.set(costCenter.reference_profit_id, 'account_profit_turnover_id');

    if (costCenter.has_cost_center) {
      await TU.locator(by.id('has_cost_center')).click();
    }

    await components.accountReferenceSelect.set(costCenter.reference_cost_id, 'account_cost_variable_reference_id');

    if (costCenter.has_service) {
      await TU.locator(by.id('has_service')).click();
    }

    await components.servicesMultipleSelect.set(costCenter.services, 'services');

    if (costCenter.assigned_project) {
      await TU.locator(by.id('assigned_project')).click();
    }

    await components.projectSelect.set(costCenter.project_id, 'project_id');

    // @TODO: Fix this:  This selection does not work
    await components.allocationBasisSelect.set('CostCenterModalCtrl.costCenter.allocation_basis.id',
      costCenter.allocation_basis);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate the unableing to assign to another expense center a reference already
   * used in another expense center when creating
   * @param costCenter
   */
  async errorCreateCostCenter(costCenter) {
    await TU.buttons.create();
    await TU.input('CostCenterModalCtrl.costCenter.label', costCenter.label);

    const isPrincipal = (costCenter.is_principal) ? 'principal' : 'auxiliary';
    await TU.locator(by.id(isPrincipal)).click();

    if (costCenter.has_profit_center) {
      await TU.locator(by.id('has_profit_center')).click();
    }

    await components.accountReferenceSelect.set(costCenter.reference_profit_id, 'account_other_profit_reference_id');

    if (costCenter.has_cost_center) {
      await TU.locator(by.id('has_cost_center')).click();
    }

    await components.accountReferenceSelect.set(costCenter.reference_cost_id, 'account_cost_fixed_reference_id');

    // FIXME(@jniles) - why submit then cancel ???  This doesn't make sense :/
    await TU.buttons.submit();
    await TU.buttons.cancel();
    await components.notification.hasError();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreateCostCenter() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('CostCenterModalCtrl.costCenter.label');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a function
   * @param label
   * @param updateCostCenter
   */
  async editCostCenter(label, updateCostCenter) {
    const { rowIndex } = await GU.getGridIndexesMatchingText(this.gridId, label);
    await GA.clickOnMethod(rowIndex, this.actionLinkColumn, 'edit-record', this.gridId);
    await TU.input('CostCenterModalCtrl.costCenter.label', updateCostCenter.label);

    if (updateCostCenter.is_update_reference) {
      const isPrincipal = (updateCostCenter.is_principal) ? 'principal' : 'auxiliary';
      await TU.locator(by.id(isPrincipal)).click();

      const isCostProfit = (updateCostCenter.is_profit) ? 'is_profit' : 'is_cost';
      await TU.locator(by.id(isCostProfit)).click();

      if (updateCostCenter.is_profit) {
        await components.accountReferenceSelect.set(
          updateCostCenter.reference_profit_id,
          'account_other_profit_reference_id',
        );
      } else {
        await components.accountReferenceSelect.set(
          updateCostCenter.reference_cost_id,
          'account_cost_fixed_reference_id',
        );
      }
    }

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate the unableing to assign to another expense center a
   * reference already used in another expense center when Updating
   * @param label
   * @param updateCostCenter
   */
  async errorEditCostCenter(label, updateCostCenter) {
    const { rowIndex } = await GU.getGridIndexesMatchingText(this.gridId, label);
    await GA.clickOnMethod(rowIndex, this.actionLinkColumn, 'edit-record', this.gridId);
    await TU.input('CostCenterModalCtrl.costCenter.label', updateCostCenter.label);

    if (updateCostCenter.is_update_reference) {
      const isPrincipal = (updateCostCenter.is_principal) ? 'principal' : 'auxiliary';
      await TU.locator(by.id(isPrincipal)).click();

      const isCostProfit = (updateCostCenter.is_profit) ? 'is_profit' : 'is_cost';
      await TU.locator(by.id(isCostProfit)).click();

      if (updateCostCenter.is_profit) {
        await components.accountReferenceSelect.set(
          updateCostCenter.reference_profit_id,
          'account_other_profit_reference_id',
        );
      } else {
        await components.accountReferenceSelect.set(
          updateCostCenter.reference_cost_id,
          'account_cost_fixed_reference_id',
        );
      }
    }

    await TU.buttons.submit();
    await TU.buttons.cancel();
    await components.notification.hasError();
  }

  /**
   * simulate a click on the delete link of a function
   * @param label
   */
  async deleteCostCenter(label) {
    const { rowIndex } = await GU.getGridIndexesMatchingText(this.gridId, label);
    await GA.clickOnMethod(rowIndex, this.actionLinkColumn, 'delete-record', this.gridId);
    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }
}

module.exports = CostCenterPage;
