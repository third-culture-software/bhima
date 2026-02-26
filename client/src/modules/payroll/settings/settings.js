angular.module('bhima.controllers')
  .controller('PayrollSettingsController', PayrollSettingsController);

PayrollSettingsController.$inject = [
  'EnterpriseService', 'NotifyService', 'SessionService', 'bhConstants', 'TransactionTypeService',
];

/**
 * Payroll Settings Controller
 * This module is a for getting/updating the parameters/settings related to Payroll
 * @param Enterprises
 * @param Notify
 * @param Session
 * @param bhConstants
 * @param TransactionTypes
 */
function PayrollSettingsController(
  Enterprises, Notify, Session, bhConstants, TransactionTypes,
) {
  const vm = this;

  vm.enterprise = {};
  vm.settings = {};

  let $touched = false;

  // bind methods
  vm.submit = submit;

  // fired on startup
  /**
   *
   */
  function startup() {
    // load enterprises
    Enterprises.read(null, { detailed : 1 })
      .then(enterprises => {
        // Assume the enterprise data has been created already
        [vm.enterprise] = enterprises;
      })
      .catch(Notify.handleError);

    // load Posting Payroll Cost Center Mode
    vm.postingPayrollCostCenterMode = bhConstants.posting_payroll_cost_center;
  }

  TransactionTypes.read()
    .then(types => {
      vm.types = types;
    })
    .catch(Notify.handleError);

  // form submission
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return 0;
    }

    // make sure only fresh data is sent to the server.
    if (form.$pristine && !$touched) {
      Notify.warn('FORM.WARNINGS.NO_CHANGES');
      return 0;
    }

    if (vm.enterprise.settings.enable_activate_pension_fund
      && vm.enterprise.settings.pension_transaction_type_id === 0) {
      form.pension_transaction_type_id.$invalid = true;
      Notify.danger('FORM.ERRORS.MISSING');
      return 0;
    }

    const changes = {};
    changes.settings = angular.copy(vm.enterprise.settings);
    const promise = Enterprises.update(vm.enterprise.id, changes);

    return promise
      .then(() => Notify.success('FORM.INFO.UPDATE_SUCCESS'))
      .then(() => Session.reload()) //
      .catch(Notify.handleError);
  }

  vm.enableIndexPaymentSetting = (val) => {
    vm.enterprise.settings.enable_index_payment_system = val;
    $touched = true;
  };

  vm.enableActivatePensionFundSetting = (val) => {
    vm.enterprise.settings.enable_activate_pension_fund = val;
    if (!vm.enterprise.settings.enable_activate_pension_fund) {
      vm.enterprise.settings.pension_transaction_type_id = 0;
    }
    $touched = true;
  };

  startup();
}
