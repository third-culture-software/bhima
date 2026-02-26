angular.module('bhima.controllers')
  .controller('ReturningPatientModalController', ReturningPatientModalCtrl);

ReturningPatientModalCtrl.$inject = [
  '$uibModalInstance', 'PatientService', 'util', 'moment', 'bhConstants', 'ReceiptModal',
];

/**
 * @param ModalInstance
 * @param Patients
 * @param util
 * @param moment
 * @param bhConstants
 * @param Receipts
 * @function ReturningPatientModalCtrl
 * @description
 * Provides client-side functionality to locate patients based on a match score.
 */
function ReturningPatientModalCtrl(ModalInstance, Patients, util, moment, bhConstants, Receipts) {
  const vm = this;

  const matchCutoff = 0.85;

  vm.params = {};

  vm.tab = 0;

  vm.toggleFullDate = toggleFullDate;
  vm.calculateYOB = calculateYOB;
  vm.dateIndicatorLabel = 'FORM.LABELS.ENTER_BIRTH_YEAR';
  vm.dateComponentLabel = 'FORM.LABELS.DOB';
  vm.viewPatientCard = viewPatientCard;

  // define limits for DOB
  vm.datepickerOptions = {
    maxDate : new Date(),
    minDate : bhConstants.dates.minDOB,
  };

  const { yearOptions, dayOptions } = bhConstants;

  /**
   *
   */
  function setDateComponent() {
    const currentOptions = vm.fullDateEnabled ? dayOptions : yearOptions;

    // set the database flag to track if a date is set to JAN 01 or if the date is unknown
    vm.dob_unknown_date = !vm.fullDateEnabled;
    angular.merge(vm.datepickerOptions, currentOptions);
  }

  vm.fullDateEnabled = true;
  setDateComponent();
  vm.yob = null;

  vm.onSelectGender = sex => {
    vm.params.sex = sex;
  };

  vm.selectTab = function selectTab(tabNum) {
    vm.tab = tabNum;
  };

  vm.isPatientFound = false;

  /**
   *
   * @param patient
   */
  function usePatient(patient) {
    vm.patient = patient;
    vm.patient.dobFormatted = moment(vm.patient.dob).format('L');
    vm.patient.age = moment().diff(vm.patient.dob, 'years');
    vm.isPatientFound = true;
  }

  /**
   *
   */
  function warnNoPatients() {
    vm.noPatientsFound = true;
    vm.hasWarning = true;
  }

  /**
   *
   */
  function warnMultiplePatients() {
    vm.hasMultiplePatients = true;
    vm.hasWarning = true;
  }

  /**
   *
   */
  function warnNoName() {
    vm.hasNoName = true;
    vm.hasWarning = true;
  }

  /**
   *
   */
  function warnNoID() {
    vm.hasNoID = true;
    vm.hasWarning = true;
  }

  /**
   *
   * @param matchScore
   * @param options
   */
  function warnMarginalMatch(matchScore, options) {
    vm.marginalMatch = true;
    vm.hasWarning = true;
    vm.matchScore = {
      score : matchScore * 100.0,
      name : options.search_name,
    };
  }

  /**
   *
   * @param uuid
   */
  function viewPatientCard(uuid) {
    Receipts.patient(uuid);
  }

  /**
   *
   * @param matches
   */
  function chooseMatch(matches) {
    vm.hasChoices = true;
    vm.choices = matches;

    // NOTE(@jniles) - these do not come back from the server sorted.  Should they?
    vm.choices.sort((a, b) => b.matchScore - a.matchScore);

    // Cleanups for the frontend
    vm.choices.forEach((row) => {

      // make sex human readable
      if (row.sex && row.sex === 'F') {
        row.hrsex = 'FORM.LABELS.FEMALE';
      } else if (row.sex && row.sex === 'M') {
        row.hrsex = 'FORM.LABELS.MALE';
      }

      // age
      row.age = moment().diff(row.dob, 'years');
    });
  }

  vm.useChoice = function useChoice(uuid) {
    usePatient(vm.choices.find(p => p.uuid === uuid));
    // vm.hasChoices = false;
    // vm.choices = null;
  };

  // Date and location utility methods
  /**
   *
   */
  function toggleFullDate() {
    vm.fullDateEnabled = !vm.fullDateEnabled;
    vm.dateIndicatorLabel = vm.fullDateEnabled ? 'FORM.LABELS.ENTER_BIRTH_YEAR' : 'FORM.LABELS.ENTER_BIRTH_DAY';
    vm.dateIndicatorIcon = vm.fullDateEnabled ? 'fa fa-circle-o' : 'fa fa-circle';
    vm.dateComponentLabel = vm.fullDateEnabled ? 'FORM.LABELS.DOB' : 'FORM.LABELS.YOB';
    setDateComponent();
  }

  /**
   *
   * @param value
   */
  function calculateYOB(value) {
    vm.dob = (value && value.length === 4)
      ? new Date(`${value}-${util.defaultBirthMonth}`)
      : undefined;
  }

  // clears all visual warnings
  /**
   *
   */
  function resetWarnings() {
    vm.noPatientsFound = false;
    vm.hasMultiplePatients = false;
    vm.hasNoName = false;
    vm.hasNoID = false;

    vm.marginalMatch = false;
    vm.matchScore = null;

    vm.hasChoices = false;
    vm.choices = null;

    vm.hasWarning = false;
  }

  // clears all entered data in the form
  vm.clearData = function clearData() {
    vm.params = {};
    resetWarnings();
  };

  vm.clearPatientSelection = function clearPatientSelection() {
    vm.patient = {};
    vm.isPatientFound = false;
  };

  vm.cancel = ModalInstance.close;

  vm.submit = function submit() {
    resetWarnings();

    let filteredParams = null;

    // If we are on Tab 0 (search by name) make sure we have a name and search
    if (vm.tab === 0) {
      // Make sure we have a name
      if (!('search_name' in vm.params)) {
        warnNoName();
        return [];
      }
      // Limit the search parameters for the Find by Name tab
      // NOTE that 'search_name' is handled specially by the find function below
      filteredParams = util.maskObjectFromKeys(vm.params, ['search_name', 'sex', 'dob']);

      filteredParams.dob_year_only = !vm.fullDateEnabled;

    } else { // Tab 1 (search by ID: reference, hospital_no)
      // Make sure we have an ID
      if (!(('reference' in vm.params) || ('hospital_no' in vm.params))) {
        warnNoID();
        return [];
      }

      // Limit the search parameters for the Find by ID tab
      filteredParams = util.maskObjectFromKeys(vm.params, ['reference', 'hospital_no']);
    }

    // Try to find the patient
    return Patients.read(null, filteredParams)
      .then(patients => {
        switch (patients.length) {
        case 0:
          warnNoPatients();
          break;

        case 1:
          if (vm.tab === 0 && patients[0].matchScore < 1) {
            warnMarginalMatch(patients[0].matchScore, filteredParams);
          }
          usePatient(patients[0]);
          break;

        default:
          if (vm.tab === 0) {
            // Tab 0 - Searching by name
            const patientMatches = patients.filter(row => row.matchScore > matchCutoff);

            switch (patientMatches.length) {
            case 0:
              warnNoPatients();
              break;

            case 1:
              if (patientMatches[0].matchScore < 1) {
                warnMarginalMatch(patients[0].matchScore, filteredParams);
              }
              usePatient(patientMatches[0]);
              break;

            default:
              // Display the possible matches and let the user pick one
              chooseMatch(patientMatches);
              break;
            }
          } else {
            // Tab 1 - Search by ID
            warnMultiplePatients();
          }
          break;
        }
      });
  };
}
