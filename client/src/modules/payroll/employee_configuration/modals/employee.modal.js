angular.module('bhima.controllers')
  .controller('EmployeeModalController', EmployeeModalController);

EmployeeModalController.$inject = [
  '$state', 'ConfigurationEmployeeService', 'bhConstants', 'EmployeeService', 'NotifyService', 'appcache', 'params',
];

/**
 *
 * @param $state
 * @param Config
 * @param Constants
 * @param Employees
 * @param Notify
 * @param AppCache
 * @param params
 */
function EmployeeModalController($state, Config, Constants, Employees, Notify, AppCache, params) {
  const vm = this;
  vm.configuration = {};
  vm.checked = [];

  vm.onChangeRoleSelection = onChangeRoleSelection;

  const cache = AppCache('EmployeeModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
  }

  vm.stateParams = cache.stateParams;
  vm.isCreateState = vm.stateParams.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;

  if (!vm.isCreateState) {
    Config.read(vm.stateParams.id)
      .then((configuration) => {
        vm.configuration = configuration;
      })
      .catch(Notify.handleError);
  }

  Employees.read()
    .then((employees) => {
      vm.employees = employees;
      return Config.getEmployeeConfiguration(vm.stateParams.id);
    })
    .then((employeeConfig) => {
      vm.checkedUuids = employeeConfig.map(row => row.employee_uuid);

      vm.disabledUuids = vm.employees
        .filter(row => row.locked)
        .map(row => row.uuid);

      // clone the original values as the new values.
      vm.checked = [...vm.checkedUuids];
    })
    .catch(Notify.handleError);

  /**
   *
   * @param data
   */
  function onChangeRoleSelection(data) {
    vm.checked = data;
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param EmployeeForm
   */
  function submit(EmployeeForm) {
    if (EmployeeForm.$invalid || EmployeeForm.$pristine) { return 0; }

    const promise = (vm.isCreateState)
      ? Config.create(vm.configuration)
      : Config.update(vm.configuration.id, vm.configuration);

    return promise
      .then(record => Config.setEmployees(record.id, vm.checked))
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('configurationEmployee', null, { reload : true });
      });
  }

  /**
   *
   */
  function closeModal() {
    $state.go('configurationEmployee');
  }
}
