// TODO Handle HTTP exception errors (displayed contextually on form)
angular.module('bhima.controllers')
  .controller('EmployeeController', EmployeeController);

EmployeeController.$inject = [
  'EmployeeService', 'ServiceService', 'GradeService', 'FunctionService', 'TitleService',
  'CreditorGroupService', 'util', 'NotifyService', '$state',
  'bhConstants', 'ReceiptModal', 'SessionService', 'RubricService', 'PatientService',
];

function EmployeeController(Employees, Services, Grades, Functions, Titles, CreditorGroups, util, Notify,
  $state, bhConstants, Receipts, Session, Rubrics, Patients) {
  const vm = this;
  const referenceUuid = $state.params.uuid;
  const { saveAsEmployee } = $state.params;

  vm.enterprise = Session.enterprise;
  vm.onSelectGrade = onSelectGrade;

  vm.isUpdating = $state.params.uuid;
  vm.updateEditLabel = vm.isUpdating
    ? 'FORM.BUTTONS.UPDATE_EMPLOYEE'
    : 'FORM.BUTTONS.REGISTER_EMPLOYEE';

  vm.origin = '';

  if (referenceUuid && !saveAsEmployee) {
    Employees.read(referenceUuid)
      .then((employee) => {
        formatEmployeeAttributes(employee);
        vm.origin = employee.hospital_no;
        vm.employee = employee;
        vm.employee.payroll = {};

        /**
        /* Finds the amounts of all Rubrics (advantage) defined by employees,
        /* these rubrics are those whose value Is defined by employee? is true
        */
        return Employees.advantage(referenceUuid);
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
    Patients.read(referenceUuid)
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

  Rubrics.read(null, { is_defined_employee : 1 })
    .then((rubrics) => {
      vm.rubrics = rubrics;
    })
    .catch(Notify.handleError);

  function formatEmployeeAttributes(employee) {

    // Sanitise DOB for Date Input
    employee.dob = new Date(employee.dob);
    employee.hiring_date = new Date(employee.hiring_date);

    // Assign name
    employee.name = employee.display_name;
    employee.displayGender = employee.sex;
    // eslint-disable-next-line no-undef
    employee.displayAge = moment().diff(employee.dob, 'years');
  }

  function onSelectGrade(element) {
    if (!vm.employee.individual_salary) {
      vm.employee.individual_salary = element.basic_salary;
    }
  }

  // Expose lenths from util
  vm.length20 = util.length20;

  // Expose validation rule for date
  vm.datepickerOptions = {
    maxDate : new Date(),
    minDate : bhConstants.dates.minDOB,
  };

  // const yearOptions = bhConstants.yearOptions;
  const { dayOptions } = bhConstants;

  setupRegistration();

  // Expose employee to the scope
  vm.employee = {};

  // default location
  vm.employee.origin_location_id = Session.enterprise.location_id;
  vm.employee.current_location_id = Session.enterprise.location_id;

  // Expose methods to the scope
  vm.submit = submit;

  // Set up page elements data (debtor select data)
  vm.onSelectDebtor = function onSelectDebtor(debtorGroup) {
    vm.employee.debtor_group_uuid = debtorGroup.uuid;
  };

  function setupRegistration() {
    vm.employee = {};

    vm.fullDateEnabled = true;
    setDateComponent();
    vm.yob = null;
  }

  function setDateComponent() {
    const currentOptions = dayOptions;

    // set the database flag to track if a date is set to JAN 01 or if the date is unknown
    vm.employee.dob_unknown_date = !vm.fullDateEnabled;

    angular.merge(vm.datepickerOptions, currentOptions);
  }

  // Loading Grades
  Grades.read(null, { detailed : 1 }).then((data) => {
    data.forEach((g) => {
      g.format = `${g.code} - ${g.text}`;
    });
    vm.grades = data;
  }).catch(Notify.handleError);

  // Loading Creditor Groups
  CreditorGroups.read().then((data) => {
    vm.creditorGroups = data;
  }).catch(Notify.handleError);

  // Loading Services
  Services.read().then((services) => {
    vm.services = services;
  }).catch(Notify.handleError);

  // Loading Functions
  Functions.read().then((data) => {
    vm.functions = data;
  }).catch(Notify.handleError);

  // Loading Titles
  Titles.read().then((data) => {
    vm.titles = data;
  }).catch(Notify.handleError);

  // submit the data to the server
  function submit(employeeForm) {
    if (employeeForm.$invalid) { return Notify.danger('FORM.ERRORS.INVALID'); }
    let promise;

    if (!vm.employee.is_patient) {
      vm.employee.current_location_id = vm.employee.current_location_id || Session.enterprise.location_id;
      vm.employee.origin_location_id = vm.employee.origin_location_id || Session.enterprise.location_id;

      promise = (!referenceUuid)
        ? Employees.create(vm.employee)
        : Employees.update(referenceUuid, vm.employee);
    } else {
      promise = Employees.patientToEmployee(vm.employee);
    }

    return promise
      .then((feedBack) => {
        // reset form state
        employeeForm.$setPristine();
        employeeForm.$setUntouched();
        vm.employee = {};

        vm.employee.current_location_id = Session.enterprise.location_id;
        vm.employee.origin_location_id = Session.enterprise.location_id;

        if (!referenceUuid) {
          Receipts.patient(feedBack.patient_uuid, true);
        } else {
          Notify.success('FORM.INFO.UPDATE_SUCCESS');

          $state.go('employeeRegistry', null, { reload : true });
        }
      })
      .catch(Notify.handleError);
  }
}
