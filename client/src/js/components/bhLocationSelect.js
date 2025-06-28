angular.module('bhima.components')

/**
 * Location Selection Component - bhLocationSelect
 */
  .component('bhLocationSelect', {
    templateUrl : 'modules/templates/bhLocationSelect.tmpl.html',
    controller  : LocationSelectController,
    bindings    : {
      locationUuid      : '=', // two-way binding
      disable           : '<?', // one-way binding
      name              : '@?',
    },
  });

LocationSelectController.$inject = ['LocationService', '$rootScope', '$scope', '$timeout'];

/**
 * Location Select Controller
 *
 * This component allows easy selection and validation of locations to be used
 * throughout bhima.
 *
 * COMPONENT LIFECYCLE
 *
 *  1. On startup, all countries are downloaded and bound the view.  If a
 *  location-uuid was provided, the location is immediately downloaded and
 *  selected in the view.
 *
 *  2. As the user changes each <select>, the dependent <select> will fire off
 *  an HTTP request to load fresh data from the server.  It will also clear the
 *  previous selections from dependent selects.
 *
 *  3. When the user finally selects a village, the location-uuid is updated
 *  with the village's uuid.
 *
 * BINDINGS
 *
 *  1. [location-uuid] : A two-way bound location uuid.  The parent controller
 *  should expect this ID to contain the selected location.
 *  2. [disable] : A hook to allow an external controller to disable the entire
 *  component.
 *
 * @constructor
 * @example
 * <bh-location-select
 *   location-uuid="ctrl.locationId">
 * </bh-location-select>
 *
 */
function LocationSelectController(Locations, $rootScope, $scope, $timeout) {
  const $ctrl = this;
  let listener;

  this.$onInit = function $onInit() {
    $ctrl.loading = false;

    // set default component name if none has been set
    $ctrl.name = $ctrl.name || 'LocationComponentForm';

    // wrap the alias call in a $timeout to ensure that the component link/ compile process has run
    $timeout(aliasComponentForm);

    /** disabled bindings for individual <select>s */
    $ctrl.disabled = {
      village  : true,
      sector   : true,
      province : true,
    };

    /**
     * Hook up a listener to the locationUuid to reload it if it is changed
     * externally.
     *
     * Note - this will also fire when updated internally, however loadLocation()
     * should detect it and prevent unnecessary HTTP requests.
     *
     * In general, $scope.$watch is more inefficient than exposing an API to the
     * parent controller.  However, this component favors minimal controller code
     * over application efficiency.  This could be optimized as the application
     * evolves.
     *
     * @TODO - this should be replaced with this.$onChanges();
     */
    $scope.$watch('$ctrl.locationUuid', loadLocation);

    /**
     * <select> component messages to be translated
     */
    $ctrl.messages = {
      country  : Locations.messages.country,
      province : Locations.messages.province,
      sector   : Locations.messages.sector,
      village  : Locations.messages.village,
    };

    // @TODO Temporary locations update fix - this should expose an API to be updated or
    // should use bhConstants
    listener = $rootScope.$on('LOCATIONS_UPDATED', refreshData);
  };

  // destroy the listener when the scope is destroyed
  this.$onDestroy = function $onDestroy() {
    listener();
  };

  /** methods */
  $ctrl.loadVillages = loadVillages;
  $ctrl.loadSectors = loadSectors;
  $ctrl.loadProvinces = loadProvinces;
  $ctrl.updateLocationUuid = updateLocationUuid;
  $ctrl.modal = openAddLocationModal;

  /**
   * This function assigns a reference to the components form onto the $scope
   * object so that it can be accessed directly in the view. This is required
   * because the component dynamically sets the form name based on the `$ctrl.name`
   * variable.
   *
   * This is a convenience method as the controller is available to the $scope
   * through the $ctrl variable. It translates the template from:
   *
   * `this[$ctrl.name].formVariable`
   *
   * into
   *
   *  `LocationForm.formVariable`
   *
   *  This improves readability and reduces the number of potential lookups required
   *  in the Angular template.
   */
  function aliasComponentForm() {
    $scope.LocationForm = $scope[$ctrl.name];
  }
  function loadCountries() {
    return Locations.countries()
      .then((countries) => {

        // bind the countries to view
        $ctrl.countries = countries;

        // if there are countries to select, show a "select a country" message
        // however, if there isn't any data, show a "no data" message. This pattern
        // is used throughout the component.
        $ctrl.messages.country = (countries.length > 0)
          ? Locations.messages.country
          : Locations.messages.empty;
      });
  }

  /** load the provinces, based on the country selected */
  function loadProvinces() {

    // don't send an HTTP request if there is no country
    if (!$ctrl.country || !$ctrl.country.uuid) { return 0; }

    // allow the <select> to be selected
    $ctrl.disabled.province = false;

    // load the provinces to bind to the view
    return Locations.provinces({ country : $ctrl.country.uuid })
      .then(provinces => {
        $ctrl.provinces = provinces;

        // show the appropriate message to the user
        $ctrl.messages.province = (provinces.length > 0)
          ? Locations.messages.province
          : Locations.messages.empty;

        // clear the dependent <select> elements
        $ctrl.sectors = [];
        $ctrl.villages = [];
      });
  }

  /** load the sectors, based on the province selected */
  function loadSectors() {
    // don't send an HTTP request if there is no province
    if (!$ctrl.province || !$ctrl.province.uuid) { return 0; }

    // allow the <select> to be selected
    $ctrl.disabled.sector = false;

    // fetch the sectors from the server
    return Locations.sectors({ province : $ctrl.province.uuid })
      .then(sectors => {
        $ctrl.sectors = sectors;

        // show the appropriate message to the user
        $ctrl.messages.sector = (sectors.length > 0)
          ? Locations.messages.sector
          : Locations.messages.empty;

        // clear the selected village
        $ctrl.villages = [];
      });
  }

  /** load the villages, based on the sector selected */
  function loadVillages() {

    // don't send an HTTP request if there is no sector
    if (!$ctrl.sector || !$ctrl.sector.uuid) { return 0; }

    // allow the <select> to be selected
    $ctrl.disabled.village = false;

    // fetch the villages from the server
    return Locations.villages({ sector : $ctrl.sector.uuid })
      .then((villages) => {
        $ctrl.villages = villages;

        // show the appropriate message to the user
        $ctrl.messages.village = (villages.length > 0)
          ? Locations.messages.village
          : Locations.messages.empty;
      });
  }

  /** updates the exposed location uuid for the client to use */
  function updateLocationUuid() {
    if ($ctrl.village) {

      // this exposes the true value of the component to the top level form validation
      // and can be used in util.filterDirtyFormElements
      /** @todo if this technique is considered useful it should be formalised (potential directive) */
      if (angular.isDefined($ctrl.name)) {
        $scope[$ctrl.name].$bhValue = $ctrl.village.uuid;
      }

      $ctrl.locationUuid = $ctrl.village.uuid;
    }
  }

  /**
   * If a location has been provided or changes, reload the datasource with the
   * provided location uuid.
   * @method loadLocation
   * @private
   */
  function loadLocation() {

    // make sure we actually have an initial location (prevents needless firing
    // during $scope churn).
    if (!$ctrl.locationUuid) { return; }

    // if the location is already selected, do not reload all datasources.  This
    // condition will occur when we manually called updateLocationUuid() from
    // the village <select> element.
    if ($ctrl.village && $ctrl.locationUuid === $ctrl.village.uuid) { return; }

    // download the location to the view via the LocationService
    Locations.location($ctrl.locationUuid)
      .then((initial) => {

        // bind initial data to each <select> elementin the view
        $ctrl.village = {
          uuid    : initial.villageUuid,
          village : initial.village,
        };

        $ctrl.sector = {
          uuid   : initial.sectorUuid,
          sector : initial.sector,
        };

        $ctrl.province = {
          uuid     : initial.provinceUuid,
          province : initial.province,
        };

        $ctrl.country = {
          uuid    : initial.countryUuid,
          country : initial.country,
        };

        updateLocationUuid();

        // refresh all data sources to allow a user to use the <select> elements.
        loadProvinces()
          .then(loadSectors)
          .then(loadVillages);
      });
  }

  // load the countries once, at startup
  loadCountries();

  function refreshData() {
    const cacheSector = angular.copy($ctrl.sector);
    const cacheVillage = angular.copy($ctrl.village);

    loadProvinces()
      .then(loadSectors)
      .then(() => {
        $ctrl.sector = cacheSector;
        return loadVillages();
      })
      .then(() => {
        $ctrl.village = cacheVillage;
      });
  }

  /**
   * Open "Add a Location" modal
   */
  function openAddLocationModal() {
    Locations.modal();
  }
}
