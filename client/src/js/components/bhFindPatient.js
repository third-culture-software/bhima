angular.module('bhima.components')
  .component('bhFindPatient', {
    controller : FindPatientComponent,
    templateUrl : 'modules/templates/bhFindPatient.tmpl.html',
    bindings : {
      patientUuid :       '<', // bind a patient uuid
      onSearchComplete :  '&', // bind callback to call when data is available
      onRegisterApi :     '&?', // expose force refresh API
      required :          '<?', // bind the required (for ng-required)
      suppressReset :     '<', // bind the reset
    },
  });

FindPatientComponent.$inject = [
  'PatientService', 'AppCache', 'NotifyService', 'SessionService', 'bhConstants',
  'BarcodeService',
];

/**
 * The Find Patient Component
 *
 * This component allows a user to search for a patient by either the
 * patient identifier (Project Abbreviation + Reference) or by typeahead on patient
 * name.
 *
 * The typeahead loads data as your type into the input box, pinging the URL
 * /patient/search/?name={string} The HTTP endpoints sends back 20 results
 * which are presented to the user.
 *
 * SUPPORTED ATTRIBUTES:
 *   - on-search-complete : a callback function called with the found patient
 *   - suppress-reset: a boolean value to suppress reset calls from the external
 *     api
 *   - on-registry-api: a callback to be called with the component's api
 *   - required: binds ng-required on the input.
 * @param Patients
 * @param AppCache
 * @param Notify
 * @param Session
 * @param bhConstants
 * @param Barcode
 */
function FindPatientComponent(Patients, AppCache, Notify, Session, bhConstants, Barcode) {
  const $ctrl = this;

  /* cache to remember which the search type of the component */
  const cache = AppCache('FindPatientComponent');

  /* @const the max number of records to fetch from the server */
  const LIMIT = 10;

  /* @const the enter key keycode */
  const ENTER_KEY = 13;

  $ctrl.$onInit = function onInit() {
    $ctrl.suppressReset = $ctrl.suppressReset || false;

    /* supported searches: by name or by id */
    $ctrl.options = {
      findById : {
        label       : 'FORM.LABELS.PATIENT_ID',
        placeholder : 'FORM.PLACEHOLDERS.SEARCH_PATIENT_ID',
      },
      findByName : {
        label       : 'FORM.LABELS.PATIENT_NAME',
        placeholder : 'FORM.PLACEHOLDERS.SEARCH_NAME',
      },
    };

    if (Session.isSettingEnabled('barcodes')) {
      $ctrl.options.findByBarcode = {
        label : 'BARCODE.SCAN_BARCODE',
      };
    }

    $ctrl.showSearchView = true;
    $ctrl.loadStatus = null;

    // fetch the initial setting for the component from appcache
    loadDefaultOption(cache.optionKey);

    // only expose the external API object if the optional callback has been
    // provided
    if (angular.isDefined($ctrl.onRegisterApi)) {
      $ctrl.onRegisterApi({
        api : { reset : $ctrl.reset, searchByUuid },
      });
    }
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.patientUuid && changes.patientUuid.currentValue) {
      searchByUuid(changes.patientUuid.currentValue);
    }
  };

  /* Expose functions and variables to the template view */
  $ctrl.searchByReference = searchByReference;
  $ctrl.searchByName = searchByName;
  $ctrl.selectPatient = selectPatient;
  $ctrl.submit = submit;
  $ctrl.findBy = findBy;
  $ctrl.reset = reset;
  $ctrl.onKeyPress = onKeyPress;

  /**
   * @function searchByUuid
   * @public
   * @param {string} uuid - the patient's UUID to be loaded programmatically from by an
   *    API call.
   * @description
   * This method exists to be called from the bhFindPatient API, initializing the component
   * with a patient's uuid.
   */
  function searchByUuid(uuid) {
    Patients.read(uuid)
      .then(patient => {
        selectPatient(patient);
      })
      .catch(Notify.handleError);
  }

  /**
   * @function searchByReference
   * @param {string} ref -patient hospital reference (e.g. HBB123 or 123)
   * @param reference
   * @description This function makes a call to BHIMA API for finding a patient
   * who is identified by a hospital reference. (e.g. HBB123)
   * if the user sends the number XXX instead of HBBXXX, the service will tail the number
   * with the current user project abbreviation to have HBBXXX for example.
   */
  function searchByReference(reference) {
    $ctrl.loadStatus = 'loading';

    const isValidNumber = !Number.isNaN(Number(reference));

    const ref = isValidNumber
      ? `${bhConstants.identifiers.PATIENT.key}.${Session.project.abbr}.${reference}`
      : reference;

    const options = {
      reference : ref,
      detailed : 1,
      limit : 1,
    };

    // query the patient's search endpoint for the
    // reference
    Patients.read(null, options)
      .then(patients => {
        selectPatient(patients[0]);
      })
      .catch(Notify.handleError);
  }

  /**
   * @function searchByName
   * @param {string} text Patient name (display_name)
   * @description This function make a call to BHIMA API for getting patients
   * according the name (display_name).
   * @returns {Array} An array of patients
   */
  function searchByName(text) {
    $ctrl.loadStatus = 'loading';

    // format query string parameters
    const options = {
      display_name : text.toLowerCase(),
      limit        : LIMIT,
    };

    return Patients.searchByName(options);
  }

  /**
   * @function submit
   * @description This function is responsible for call the appropriate function
   * according we have a search by ID or a search by Name to get data
   */
  function submit() {
    if ($ctrl.selected === $ctrl.options.findById && $ctrl.idInput) {
      searchByReference($ctrl.idInput);
    } else if ($ctrl.selected === $ctrl.options.findByName && $ctrl.nameInput) {
      // patient has been selected from a list of names/ references
      // very limited information is known about the patient - get details by UUID
      searchByUuid($ctrl.nameInput.uuid);
    }
  }

  /**
   * @function findBy
   * @param {object} option The selected option
   * @param key
   * @description This function is responsible for setting the selected option
   * between ID or Name option of search
   */
  function findBy(key) {
    if (key === 'findByBarcode') {
      openBarcodeScanner();
      return;
    }

    $ctrl.selected = $ctrl.options[key];
    resetState();

    // save the option for later
    cache.optionKey = key;

  }

  // Common base values that can be used to set a new search
  /**
   *
   */
  function resetState() {
    $ctrl.loadStatus = null;
    delete $ctrl.idInput;
    delete $ctrl.nameInput;
  }

  /**
   * @function reset
   * @description This function is responsible for enabling the user to input data
   * again for search by showing the inputs zones (search by ID or by name) again.
   */
  function reset() {
    resetState();
    $ctrl.showSearchView = true;
  }

  /**
   * @function formatPatient
   * @param {object} patient The patient object
   * @param p
   * @description This function is responsible for formatting the patient name
   * to be more readable
   * @returns {string} The formatted patient name
   */
  function formatPatient(p) {
    return p ? p.display_name : '';
  }

  /**
   * @function selectPatient
   * @param {object} patient The patient object
   * @description This function is responsible for handling the result of the search,
   * display results and pass the returned patient to the parent controller
   */
  function selectPatient(patient) {
    $ctrl.showSearchView = false;

    if (patient && typeof (patient) === 'object') {
      $ctrl.loadStatus = 'loaded';
      $ctrl.patient = patient;

      // parse patient metadata
      patient.name = formatPatient(patient);
      patient.sex = patient.sex.toUpperCase();

      // call the external function with patient
      $ctrl.onSearchComplete({ patient });

    } else {
      $ctrl.loadStatus = 'error';
    }
  }

  /**
   * @function loadDefaultOption
   * @param {object} key - the default option key to search by
   * @param optionKey
   * @description This function is responsible for changing the option of search.
   * Search by ID or by name
   */
  function loadDefaultOption(optionKey = 'findById') {
    // change the findBy call
    findBy(optionKey);
  }

  /**
   * @function onKeyPress
   * @param {object} event - a DOM event bubbled up to the function
   * @description
   * This function capture the "Enter" key push of the user and call a function
   * to do something.
   */
  function onKeyPress(event) {

    // submit the find-patient form
    if (event.keyCode === ENTER_KEY) {
      $ctrl.submit();

      // make sure we do not submit the parent form!
      event.preventDefault();
    }
  }

  /**
   * @function openBarcodeScanner
   * @description
   * Opens the barcode scanner for scanning the
   */
  function openBarcodeScanner() {
    Barcode.modal()
      .then(record => {
        searchByUuid(record.uuid);
      });
  }
}
