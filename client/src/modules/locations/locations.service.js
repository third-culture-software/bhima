angular.module('bhima.services')
  .service('LocationService', LocationService);

LocationService.$inject = ['$http', 'util', '$uibModal'];

/**
 * Location Service
 *
 * Interacts with the /locations API.  It currently supports reading from the
 * database for all location entities, but only will support a detailed query
 * for a village uuid (via the location()) method.
 *
 * Supported Actions:
 *  - Lists:
 *    - countries
 *    - provinces
 *    - sectors
 *    - villages
 *  - Details:
 *    - village (via .location())
 *  - Create:
 *    - countries
 *    - provinces
 *    - sectors
 *    - villages
 *
 * Eventually this service may have to be broke in two to group related
 * functions and reduce complexity.  For example, the create interfaces are only
 * needed on specific modules, whereas the read interfaces may be needed in a
 * variety of places.
 *
 * @class LocationService
 */
function LocationService($http, util, Modal) {
  const service = {};
  const baseUrl = '/locations';

  /** read interfaces */
  service.countries = countries;
  service.provinces = provinces;
  service.sectors = sectors;
  service.villages = villages;
  service.locations = locations;

  /** detail interfacs */
  service.location = location;

  /** location creation interfaces */
  service.create = {};
  service.create.country = createCountry;
  service.create.province = createProvince;
  service.create.sector = createSector;
  service.create.village = createVillage;

  /** location update interfaces */
  service.update = {};
  service.update.country = updateCountry;
  service.update.province = updateProvince;
  service.update.sector = updateSector;
  service.update.village = updateVillage;
  service.merge = merge;

  service.delete = {
    country : removeCountry,
    province : removeProvince,
    sector : removeSector,
    village : removeVillage,
  };

  /** launch the "add location" modal */
  service.modal = modal;

  /** translation messages used in location <select> components */
  service.messages = {
    country :  'FORM.SELECT.COUNTRY',
    province : 'FORM.SELECT.PROVINCE',
    sector :   'FORM.SELECT.SECTOR',
    village :  'FORM.SELECT.VILLAGE',
    empty :    'FORM.SELECT.EMPTY',
  };

  /**
   * wrapper for HTTP requests made to the baseUrl endpoint
   * @private
   */
  function request(path, options) {
    return $http.get(baseUrl.concat(path), options)
      .then(util.unwrapHttpResponse);
  }

  /**
   * fetch a list of villages from the server
   * @public
   */
  function villages(options) {
    return request('/villages', { params : options });
  }

  /**
   * fetch a list of sectors from the server
   * @public
   */
  function sectors(options) {
    return request('/sectors', { params : options });
  }

  /**
   * fetch a list of provinces from the server
   * @public
   */
  function provinces(options) {
    return request('/provinces', { params : options });
  }

  /**
   * fetch a list of countries from the server
   * @public
   */
  function countries() {
    return request('/countries');
  }

  /**
   * fetch the village, sector, province, and country for a particular village
   * uuid from the database.
   *
   * @param {String} a village uuid to look up
   * @public
   */
  function location(uuid) {
    return request('/detail/'.concat(uuid));
  }

  /**
   * Opens the "Add a Location" modal in place
   */
  function modal() {
    return Modal.open({
      templateUrl : 'modules/templates/modals/location.modal.html',
      controller : 'LocationModalController as LocationModalCtrl',
      size : 'md',
    }).result;
  }

  /**
   * generic interface for creation methods
   * @private
   */
  function createGeneric(endpoint, data) {
    return $http.post(baseUrl.concat(endpoint), data)
      .then(util.unwrapHttpResponse);
  }

  /**
   * creates a country in the database
   * @public
   */
  function createCountry(data) {
    return createGeneric('/countries', data);
  }

  function createProvince(data) {
    return createGeneric('/provinces', data);
  }

  function createSector(data) {
    return createGeneric('/sectors', data);
  }

  function createVillage(data) {
    return createGeneric('/villages', data);
  }

  /**
   * Update location in the database
   * @public
   */
  function updateCountry(uuid, country) {
    return $http.put('/locations/countries/'.concat(uuid), country)
      .then(util.unwrapHttpResponse);
  }

  function removeCountry(uuid) {
    return $http.delete(`/locations/countries/${uuid}`)
      .then(util.unwrapHttpResponse);
  }

  function removeProvince(uuid) {
    return $http.delete(`/locations/provinces/${uuid}`)
      .then(util.unwrapHttpResponse);
  }

  function removeSector(uuid) {
    return $http.delete(`/locations/sectors/${uuid}`)
      .then(util.unwrapHttpResponse);
  }
  function removeVillage(uuid) {
    return $http.delete(`/locations/villages/${uuid}`)
      .then(util.unwrapHttpResponse);
  }

  function updateProvince(uuid, province) {
    const provinceClean = {
      country_uuid : province.country_uuid,
      name : province.name,
    };

    return $http.put('/locations/provinces/'.concat(uuid), provinceClean)
      .then(util.unwrapHttpResponse);
  }

  function updateSector(uuid, sector) {
    const sectorClean = {
      province_uuid : sector.province_uuid,
      name : sector.name,
    };

    return $http.put('/locations/sectors/'.concat(uuid), sectorClean)
      .then(util.unwrapHttpResponse);
  }

  function updateVillage(uuid, village) {
    const villageClean = {
      sector_uuid : village.sector_uuid,
      name : village.name,
      longitude : village.longitude,
      latitude : village.latitude,
    };

    return $http.put('/locations/villages/'.concat(uuid), villageClean)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method merge
   *
   * @description
   * This method merge two locations into a one
   *
   * @param {object} params { selected: String, other: Array }
   */
  function merge(params) {
    const path = `/locations/merge`;
    return $http.post(path, params)
      .then(util.unwrapHttpResponse);
  }

  /**
   * fetch a list of all data about locations from the server
   * @public
   */
  function locations(options) {
    return request('/detail', { params : options });
  }

  return service;
}
