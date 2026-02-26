angular.module('bhima.components')
  .component('bhEmployeeSelect', {
    templateUrl : 'modules/templates/bhEmployeeSelect.tmpl.html',
    controller  : EmployeeSelectController,
    transclude  : true,
    bindings    : {
      employeeUuid     : '<?',
      onSelectCallback : '&',
      required         : '<?',
    },
  });

EmployeeSelectController.$inject = [
  'EmployeeService', 'NotifyService',
];

/**
 * Employee selection component
 * @param Employees
 * @param Notify
 */
function EmployeeSelectController(Employees, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {

    // load all Employee
    Employees.read()
      .then(employees => {

        employees.forEach(employee => {
          employee.hrlabel = `${employee.reference} - ${employee.display_name}`;
        });

        $ctrl.employees = employees;
      })
      .catch(Notify.handleError);

    $ctrl.valid = true;
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = employee => {
    $ctrl.onSelectCallback({ employee });
  };
}
