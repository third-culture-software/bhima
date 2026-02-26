angular.module('bhima.controllers')
  .controller('LocationModalController', LocationModalController);

LocationModalController.$inject = [
  '$rootScope', 'LocationService', '$uibModalInstance', 'appcache', 'Store', 'NotifyService',
];

/**
 * "Add a Location" Modal
 *
 * This modal can be injected into any page, and is useful for creating
 * locations on the fly.  The user is asked to choose from countries,
 * provinces, and sectors as needed to create a new location.  It shares many
 * similarities with the bhLocationSelect component.
 * @param $rootScope
 * @param Locations
 * @param Instance
 * @param AppCache
 * @param Store
 * @param Notify
 * @class LocationModalController
 */
function LocationModalController($rootScope, Locations, Instance, AppCache, Store, Notify) {
  const vm = this;

  /** caches the current view in local storage */
  const cache = AppCache('bh-location-select-modal');

  // use to simply refresh the mdoal state
  vm.registerMultiple = false;

  /**
   * This is not the best way to do states, but for such a complex component,
   * this seems to be the clearest way forward.  The view is cached in AppCache
   * under the cacheKey.
   *
   * The onEnter() functions are run to clear dependent models, so the input
   * doesn't have an [object Object] written in it.
   * @constant
   */
  vm.views = {
    country : {
      cacheKey : 'country',
      translateKey : 'FORM.LABELS.COUNTRY',
      index : 1,
      onEnter : function onEnter() { delete vm.country; },
    },
    province : {
      cacheKey : 'province',
      translateKey : 'FORM.LABELS.PROVINCE',
      index : 2,
      onEnter : function onEnter() { delete vm.province; },
    },
    sector : {
      cacheKey : 'sector',
      translateKey : 'FORM.LABELS.SECTOR',
      index : 3,
      onEnter : function onEnter() { delete vm.sector; },
    },
    village : {
      cacheKey : 'village',
      translateKey : 'FORM.LABELS.VILLAGE',
      index : 4,
      onEnter : function onEnter() { delete vm.village; },
    },
  };

  /**
   * messages to be displayed in the <select> options.  Normally, these are
   * "Select a X", but in case there is no data, a no data message is displayed.
   */
  vm.messages = {
    country : Locations.messages.country,
    province : Locations.messages.province,
    sector : Locations.messages.sector,
  };

  /** cancels the create location modal */
  vm.dismiss = Instance.dismiss;

  /** sets the modal location view/state */
  vm.setView = setView;

  /** bind listener */
  vm.loadProvinces = loadProvinces;
  vm.loadSectors = loadSectors;
  vm.submit = submit;

  loadView(cache.view);

  /**
   * load previous/default view
   * @param key
   */
  function loadView(key = vm.views.country.cacheKey) {
    setView(key);
  }

  loadCountries();

  /**
   *
   */
  function loadCountries() {
    Locations.countries()
      .then((countries) => {

        // bind the countries to the view for <select>ion
        vm.countries = countries;

        // make sure that we are showing the proper message to the client
        vm.messages.country = (countries.length > 0)
          ? Locations.messages.country
          : Locations.messages.empty;
      });
  }

  /** loads provinces based on the selected country */
  function loadProvinces() {

    // make sure we do not make unnecessary HTTP requests
    if (!vm.country || !vm.country.uuid) { return; }

    Locations.provinces({ country : vm.country.uuid })
      .then((provinces) => {

        // bind the provinces to the view for <select>ion
        vm.provinces = provinces;

        // make sure that we show the correct message in the <select> option
        vm.messages.province = (provinces.length > 0)
          ? Locations.messages.province
          : Locations.messages.empty;
      });
  }

  /** loads sectors based on the selected province */
  function loadSectors() {

    // make sure we do not make unnecessary HTTP requests
    if (!vm.province || !vm.province.uuid) { return; }

    Locations.sectors({ province : vm.province.uuid })
      .then((sectors) => {

        // bind the sectors to the view for <select>ion
        vm.sectors = sectors;

        // make sure that we show the correct message in the <select> option
        vm.messages.sector = (sectors.length > 0)
          ? Locations.messages.sector
          : Locations.messages.empty;
      });
  }

  /**
   * show/hide different values
   * @param key
   */
  function setView(key) {

    // cache the value for later
    cache.view = key;

    // set the current view to the selected one.
    vm.view = vm.views[key];

    // run the onEnter() function.
    vm.view.onEnter();
  }

  /**
   * creates a new location based on the selections made.
   * @param form
   */
  function submit(form) {

    // delete the HTTP error if it exists
    delete vm.error;

    // reject an invalid form
    if (form.$invalid) { return 0; }

    let promise;

    /**
     * determine wht type of location we are creating and send an $http
     * request for it.
     */
    switch (vm.view) {
    case vm.views.country:
      promise = Locations.create.country({
        name : vm.country,
      });
      break;

    case vm.views.province:
      promise = Locations.create.province({
        name : vm.province,
        country_uuid : vm.country.uuid,
      });
      break;

    case vm.views.sector:
      promise = Locations.create.sector({
        name : vm.sector,
        province_uuid : vm.province.uuid,
      });
      break;

    case vm.views.village:
      promise = Locations.create.village({
        name : vm.village,
        sector_uuid : vm.sector.uuid,
      });
      break;

    default:
      return 0;
    }

    return promise
      .then(data => {

        // notify success
        Notify.success('FORM.INFO.CREATE_SUCCESS');
        $rootScope.$broadcast('LOCATIONS_UPDATED', data);

        if (vm.registerMultiple) {

          // make the form pristine again
          form.$setPristine();

          if (vm.view === vm.views.country) {
            delete vm.country;
            return loadCountries();
          } if (vm.view === vm.views.province) {
            delete vm.province;
            return loadProvinces();
          } if (vm.view === vm.views.sector) {
            delete vm.sector;
            return loadSectors();
          }
          delete vm.village;
          return 0;

        }

        return Instance.close(data);
      })
      .catch((error) => {
        vm.error = error;
      });
  }
}
