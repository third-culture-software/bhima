angular.module('bhima.components')

/**
 * Location Selection Component - bhLocationSelect
 */
  .component('bhLocationSelect', {
    templateUrl : 'modules/templates/bhLocationSelect.tmpl.html',
    controller  : LocationSelectController,
    bindings    : {
      locationUuid      : '<',
      disable           : '<?',
      name              : '@?',
      onLocationChange  : '&', 
    },
  });

LocationSelectController.$inject = ['LocationService', '$scope', '$q', 'NotifyService'];

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
 *  3. When the user finally selects a village, on-location-change is invoked
 *  with the village's uuid.  Clearing a downstream selection invokes
 *  on-location-change with null, so the parent never holds onto a stale
 *  value.
 *
 * BINDINGS
 *
 *  1. [location-uuid] : A one-way bound location uuid used to initialise (or
 *  externally reset) the component's selection.  The component does not
 *  mutate this binding - use on-location-change to receive updates.
 *  2. [disable] : A hook to allow an external controller to disable the entire
 *  component.
 *  3. [on-location-change] : Callback invoked with `{ uuid }` whenever the
 *  selected village changes, including being cleared (uuid will be null).
 * @param Locations
 * @param $scope
 * @param $q
 * @param Notify
 * @class
 * @example
 * <bh-location-select
 *   location-uuid="ctrl.locationId"
 *   on-location-change="ctrl.onLocationChange(uuid)">
 * </bh-location-select>
 */
function LocationSelectController(Locations, $scope, $q, Notify) {
  const $ctrl = this;

  // monotonically increasing counters used to guard against out-of-order
  // HTTP responses when a user changes selections faster than the network
  // can respond (e.g. clicking through provinces quickly).
  const sequence = { province : 0, sector : 0, village : 0 };

  this.$onInit = function $onInit() {
    // set default component name if none has been set
    $ctrl.name = $ctrl.name || 'LocationComponentForm';

    /** disabled bindings for individual <select>s */
    $ctrl.disabled = {
      village  : true,
      sector   : true,
      province : true,
    };

    /**
     * <select> component messages to be translated
     */
    $ctrl.messages = {
      country  : Locations.messages.country,
      province : Locations.messages.province,
      sector   : Locations.messages.sector,
      village  : Locations.messages.village,
    };

    // load the countries once, at startup
    loadCountries();
  };

  /**
   * Runs after the component's template (and this controller's `name`-based
   * form) has been linked, so `$scope[$ctrl.name]` is guaranteed to exist.
   * This replaces the previous $timeout(fn) hack, which relied on digest
   * timing rather than an explicit lifecycle guarantee.
   */
  this.$postLink = function $postLink() {
    $scope.LocationForm = $scope[$ctrl.name];
  };

  /**
   * locationUuid is now a one-way ('<') binding, so this fires whenever the
   * parent passes in a new value - including the initial value on mount.
   * Internal selections no longer write back to $ctrl.locationUuid (see
   * updateLocationUuid), so this will not re-fire as a side effect of the
   * user's own selections.
   * @param changes
   */
  this.$onChanges = function $onChanges(changes) {
    if (changes.locationUuid) {
      loadLocation();
    }
  };

  /** methods */
  $ctrl.loadVillages = loadVillages;
  $ctrl.loadSectors = loadSectors;
  $ctrl.loadProvinces = loadProvinces;
  $ctrl.updateLocationUuid = updateLocationUuid;
  $ctrl.modal = openAddLocationModal;

  /**
   * @function loadCountries
   */
  function loadCountries() {
    return Locations.countries()
      .then((countries) => {
        $ctrl.countries = countries;

        // if there are countries to select, show a "select a country" message
        // however, if there isn't any data, show a "no data" message. This pattern
        // is used throughout the component.
        $ctrl.messages.country = (countries.length > 0)
          ? Locations.messages.country
          : Locations.messages.empty;
      })
      .catch(handleError);
  }

  /** load the provinces, based on the country selected */
  function loadProvinces() {
    // clear anything downstream immediately so stale options never linger
    // in the UI while the request is in flight.
    $ctrl.provinces = [];
    $ctrl.sectors = [];
    $ctrl.villages = [];
    $ctrl.disabled.province = true;
    $ctrl.disabled.sector = true;
    $ctrl.disabled.village = true;

    // don't send an HTTP request if there is no country
    if (!$ctrl.country || !$ctrl.country.uuid) { return $q.resolve(); }

    const requestId = ++sequence.province;

    return Locations.provinces({ country : $ctrl.country.uuid })
      .then(provinces => {
        // a newer request has since started - discard this stale response
        if (requestId !== sequence.province) { return; }

        $ctrl.provinces = provinces;
        $ctrl.disabled.province = false;

        $ctrl.messages.province = (provinces.length > 0)
          ? Locations.messages.province
          : Locations.messages.empty;
      })
      .catch(handleError);
  }

  /** load the sectors, based on the province selected */
  function loadSectors() {
    $ctrl.sectors = [];
    $ctrl.villages = [];
    $ctrl.disabled.sector = true;
    $ctrl.disabled.village = true;

    // don't send an HTTP request if there is no province
    if (!$ctrl.province || !$ctrl.province.uuid) { return $q.resolve(); }

    const requestId = ++sequence.sector;

    return Locations.sectors({ province : $ctrl.province.uuid })
      .then(sectors => {
        if (requestId !== sequence.sector) { return; }

        $ctrl.sectors = sectors;
        $ctrl.disabled.sector = false;

        $ctrl.messages.sector = (sectors.length > 0)
          ? Locations.messages.sector
          : Locations.messages.empty;
      })
      .catch(handleError);
  }

  /** load the villages, based on the sector selected */
  function loadVillages() {
    $ctrl.villages = [];
    $ctrl.disabled.village = true;

    // don't send an HTTP request if there is no sector
    if (!$ctrl.sector || !$ctrl.sector.uuid) { return $q.resolve(); }

    const requestId = ++sequence.village;

    return Locations.villages({ sector : $ctrl.sector.uuid })
      .then((villages) => {
        if (requestId !== sequence.village) { return; }

        $ctrl.villages = villages;
        $ctrl.disabled.village = false;

        $ctrl.messages.village = (villages.length > 0)
          ? Locations.messages.village
          : Locations.messages.empty;
      })
      .catch(handleError);
  }

  /**
   * Notifies the parent of the currently selected village uuid (or null, if
   * cleared) via the on-location-change callback binding.  Since
   * locationUuid is now a one-way binding, the component never writes back
   * to it directly - the parent is expected to update location-uuid itself
   * (or not) in response to this callback.
   */
  function updateLocationUuid() {
    const uuid = ($ctrl.village && $ctrl.village.uuid) ? $ctrl.village.uuid : null;

    // this exposes the true value of the component to the top level form validation
    // and can be used in util.filterDirtyFormElements
    /** @todo if this technique is considered useful it should be formalised (potential directive) */
    if (angular.isDefined($ctrl.name) && $scope[$ctrl.name]) {
      $scope[$ctrl.name].$bhValue = uuid;
    }

    $ctrl.onLocationChange({ uuid });
  }

  /**
   * If a location has been provided or changes, reload the datasource with the
   * provided location uuid.
   * @function loadLocation
   * @private
   */
  function loadLocation() {
    // make sure we actually have an initial location (prevents needless firing
    // during $scope churn).
    if (!$ctrl.locationUuid) { return; }

    // if the location is already selected, do not reload all datasources.
    // This condition will occur if the parent happens to pass the same
    // location-uuid back in (e.g. echoing the value from onLocationChange).
    if ($ctrl.village && $ctrl.locationUuid === $ctrl.village.uuid) { return; }

    // download the location to the view via the LocationService
    Locations.location($ctrl.locationUuid)
      .then((initial) => {
        // bind initial data to each <select> element in the view. Use `name`
        // (not `village`/`sector`/etc.) since that's the property the
        // ng-options expressions in the template actually read - the old
        // keys silently broke the initial display labels.
        $ctrl.village = {
          uuid : initial.villageUuid,
          name : initial.village,
        };

        $ctrl.sector = {
          uuid : initial.sectorUuid,
          name : initial.sector,
        };

        $ctrl.province = {
          uuid : initial.provinceUuid,
          name : initial.province,
        };

        $ctrl.country = {
          uuid : initial.countryUuid,
          name : initial.country,
        };

        // refresh all data sources to allow a user to use the <select> elements.
        return loadProvinces()
          .then(loadSectors)
          .then(loadVillages);
      })
      .catch(handleError);
  }

  /**
   * Open "Add a Location" modal
   */
  function openAddLocationModal() {
    Locations.modal()
      .finally(() => {
        loadCountries()
          .then(loadProvinces)
          .then(loadSectors)
          .then(loadVillages);
      });
  }

  /**
   * Centralised error handling so a failed request never hangs silently.
   * Replace with the app's real error/notification service as appropriate.
   * @param error
   */
  function handleError(error) {
    Notify.handleError(error)
  }
}
