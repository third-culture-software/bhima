angular.module('bhima.controllers')
  .controller('MultiPayrollIndiceParamModalController', MultiPayrollIndiceParamModalController);

MultiPayrollIndiceParamModalController.$inject = [
  'NotifyService', 'MultipleIndicesPayrollService', '$uibModalInstance',
  'SessionService', 'LanguageService',
];

function MultiPayrollIndiceParamModalController(Notify, MultiplePayroll, Instance, Session, Languages) {
  const vm = this;
  vm.close = Instance.close;
  vm.param = {};
  vm.is_linked_pension_fund = 0;

  vm.onInputTextChange = (key, val) => { vm.param[key] = val; };

  vm.currencyId = Session.enterprise.currency_id;
  vm.enableActivatePensionFund = Session.enterprise.settings.enable_activate_pension_fund;

  vm.onSelectPayrollPeriod = (payrollConfig) => {
    vm.param = {};
    vm.param.payroll_configuration_id = payrollConfig.id;
    MultiplePayroll.parameters.read(payrollConfig.id).then(parameter => {
      if (parameter.length) {
        const [param] = parameter;
        if (param.pension_fund > 0) {
          vm.is_linked_pension_fund = 1;
        }

        vm.param = param;
      }
    });
  };

  vm.submit = (form) => {
    if (form.$invalid) { return 0; }
    vm.param.lang = Languages.key;

    if (!vm.is_linked_pension_fund) {
      vm.param.pension_fund = 0;
    }

    return MultiplePayroll.parameters.create(vm.param).then(() => {
      Notify.success('FORM.INFO.OPERATION_SUCCESS');
      return vm.close(true);
    })
      .catch((error) => {
        if (error.status === 400) {
          Notify.errorMessage(error.data.code);
          vm.close(true);
        }

        Notify.handleError(error);
      });
  };

}
