angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('employeeRegister', {
        url         : '/employees/register',
        controller  : 'EmployeeController as EmployeeCtrl',
        templateUrl : 'modules/employees/registration/employees.html',
      })
      .state('employeeEdit', {
        url         : '/employees/:uuid/edit',
        controller  : 'EmployeeController as EmployeeCtrl',
        templateUrl : 'modules/employees/registration/employees.html',
      })
      .state('patientAsEmployee', {
        url         : '/employees/:uuid/patientAsEmployee',
        params : {
          saveAsEmployee : { value : true },
        },
        controller  : 'EmployeeController as EmployeeCtrl',
        templateUrl : 'modules/employees/registration/employees.html',
      })
      .state('employeeRegistry', {
        url         : '/employees',
        controller  : 'EmployeeRegistryController as EmployeeRegistryCtrl',
        templateUrl : '/modules/employees/registry/registry.html',
        params      : {
          filters : [],
        },
      });
  }]);
