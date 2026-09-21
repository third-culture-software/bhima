// TODO Handle HTTP exception errors (displayed contextually on form)
angular.module('bhima.controllers')
  .controller('EmployeeController', EmployeeController);

EmployeeController.$inject = [
  'EmployeeService', 'CreditorGroupService', 'util', 'NotifyService', '$state',
  'bhConstants', 'ReceiptModal', 'SessionService', 'RubricService', 'PatientService', 'moment',
];

/**
 *
 * @param Employees
 * @param CreditorGroups
 * @param util
 * @param Notify
 * @param $state
 * @param bhConstants
 * @param Receipts
 * @param Session
 * @param Rubrics
 * @param Patients
 * @param moment
 */
function EmployeeController(Employees, CreditorGroups, util, Notify,
  $state, bhConstants, Receipts, Session, Rubrics, Patients, moment) {
  const vm = this;

  // If a UUID was passed in, we are in update mode. 
  vm.isUpdating = !!$state.params.uuid;
  const { uuid :employeeUuid, saveAsEmployee } = $state.params;

  vm.enterprise = Session.enterprise;

  vm.onSelectGrade = (grade) => {
    vm.employee.grade_uuid = grade.uuid;
    if (!vm.employee.individual_salary) {
      vm.employee.individual_salary = grade.basic_salary;
    }
  }

  vm.origin = '';

  vm.onLocationChange = (uuid, key) => {
    vm[key] = uuid;
  };

  vm.onSalaryChange = (value) => {
    vm.employee.individual_salary = value;
  };

  vm.onPayrollValueChange = (value, rubricId) => {
    if (vm.employee.payroll) {
      vm.employee.payroll[rubricId] = value;
    }
  }

  // Expose methods to the scope
  vm.submit = submit;

  vm.onSelectDebtor = (debtorGroup) => {
    vm.employee.debtor_group_uuid = debtorGroup.uuid;
  };

  if (employeeUuid && !saveAsEmployee) {
    Employees.read(employeeUuid)
      .then((employee) => {
        formatEmployeeAttributes(employee);
        vm.origin = employee.hospital_no;
        vm.employee = employee;
        vm.employee.payroll = {};

        /*
        /* Finds the amounts of all Rubrics (advantage) defined by employees,
        /* these rubrics are those whose value Is defined by employee? is true
        */
        return Employees.advantage(employeeUuid);
      })
      .then((advantages) => {
        advantages.forEach((advantage) => {
          vm.employee.payroll[advantage.rubric_payroll_id] = advantage.value;
        });
      })
      .catch((error) => {

        // handle error and update view to show no results - this could be improved
        Notify.handleError(error);
        vm.unknownId = true;
      });
  }

  if (saveAsEmployee) {
    Patients.read(employeeUuid)
      .then((patient) => {
        vm.employee.display_name = patient.display_name;
        vm.employee.dob = new Date(patient.dob);
        vm.employee.sex = patient.sex;
        vm.employee.hospital_no = patient.hospital_no;
        vm.employee.is_patient = true;
        vm.employee.patient_uuid = patient.uuid;
        vm.employee.debtor_uuid = patient.debtor_uuid;
        vm.employee.debtor_group_uuid = patient.debtor_group_uuid;
        vm.employee.current_location_id = patient.current_location_id;
        vm.employee.origin_location_id = patient.origin_location_id;
      })
      .catch((error) => {
        // handle error and update view to show no results - this could be improved
        Notify.handleError(error);
        vm.unknownId = true;
      });
  }

  /**
   *
   * @param employee
   */
  function formatEmployeeAttributes(employee) {

    // Sanitise DOB for Date Input
    employee.dob = new Date(employee.dob);
    employee.hiring_date = new Date(employee.hiring_date);

    // Assign name
    employee.name = employee.display_name;
    employee.displayGender = employee.sex;
    employee.displayAge = moment().diff(employee.dob, 'years');

  }

  // Expose lengths from util
  vm.length20 = util.length20;

  // Expose validation rule for date
  vm.datepickerOptions = {
    maxDate : new Date(),
    minDate : bhConstants.dates.minDOB,
  };

  setupRegistration();

  /**
   *
   */
  function setupRegistration() {
    vm.employee = { payroll : {} };

    // default location
    vm.employee.origin_location_id = Session.enterprise.location_id;
    vm.employee.current_location_id = Session.enterprise.location_id;

    vm.fullDateEnabled = true;

    const currentOptions = bhConstants.dayOptions;

    // set the database flag to track if a date is set to JAN 01 or if the date is unknown
    // TODO(@jniles): I don't think this is necessary in the case of employees.  We require a DOB.
    vm.employee.dob_unknown_date = !vm.fullDateEnabled;

    angular.merge(vm.datepickerOptions, currentOptions);

    vm.yob = null;

    Promise.all([
      Rubrics.read(null, { is_defined_employee : 1 }),
      CreditorGroups.read(),
    ])
      .then(([rubrics, creditorGroups]) => {
        Object.assign(vm, { rubrics, creditorGroups });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param employeeForm
   */
  function submit(employeeForm) {
    if (employeeForm.$invalid) { return Notify.danger('FORM.ERRORS.INVALID'); }

    delete vm.employee.dob_unknown_date;

    let promise;

    if (!vm.employee.is_patient) {
      vm.employee.current_location_id = vm.employee.current_location_id || Session.enterprise.location_id;
      vm.employee.origin_location_id = vm.employee.origin_location_id || Session.enterprise.location_id;

      promise = (!employeeUuid)
        ? Employees.create(vm.employee)
        : Employees.update(employeeUuid, vm.employee);
    } else {
      promise = Employees.patientToEmployee(vm.employee);
    }

    return promise
      .then((feedBack) => {
        // reset form state
        employeeForm.$setPristine();
        employeeForm.$setUntouched();

        if (!employeeUuid) {
          Receipts.patient(feedBack.patient_uuid, true);
          setupRegistration();
        } else {
          Notify.success('FORM.INFO.UPDATE_SUCCESS');
          $state.go('employeeRegistry', null, { reload : true });
        }
      })
      .catch(Notify.handleError);
  }
}
