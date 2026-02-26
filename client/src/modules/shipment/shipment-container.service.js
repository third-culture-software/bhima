angular.module('bhima.services')
  .service('ShipmentContainerService', ShipmentContainerService);

ShipmentContainerService.$inject = [
  'PrototypeApiService', '$http', 'util', '$translate'];

/**
 *
 * @param Api
 * @param $http
 * @param util
 * @param $translate
 */
function ShipmentContainerService(
  Api, $http, util, $translate) {

  const service = new Api('/shipment_containers/');

  service.NOT_CREATED = 'notCreated'; // To make sure both edit-container.modal and create-shipment are consistent

  /**
   * @param shipmentUuid
   * @function list()
   * @returns list of containers
   */
  service.list = (shipmentUuid) => {
    return $http.get(`/shipment_containers/${shipmentUuid}`)
      .then(util.unwrapHttpResponse)
      .then((containers) => {
        containers.forEach((cont) => {
          cont.container_type = $translate.instant(`SHIPMENT.CONTAINER_TYPES.${cont.container_type}`);
        });
        return containers;
      });
  };

  /**
   * @description Get the details of a specific container
   * @param {string} uuid
   * @returns {object} scan details
   */
  service.details = uuid => {
    return $http.get(`/shipment_containers/${uuid}`)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Create a new scan
   * @param {object} params
   * @returns {string} UUID of newly created container
   */
  service.create = params => {
    return $http.post(`/shipment_containers`, params)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Update a specific container
   * @param {string} uuid of container to change
   * @param {object} params items to change
   * @returns
   */
  service.update = (uuid, params) => {
    return $http.put(`/shipment_containers/${uuid}`, params)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Delete a specific container
   * @param {string} uuid
   * @returns result of operation
   */
  service.delete = uuid => {
    return $http.delete(`/shipment_containers/${uuid}`)
      .then(util.unwrapHttpResponse);
  };

  // --------------------------------------------------------------------------------------------
  // Container Types
  // @TODO: Move to its own file
  //
  service.containerTypes = () => {
    return $http.get('/shipment_container_types')
      .then(util.unwrapHttpResponse)
      .then((containerTypes) => {
        containerTypes.forEach(ctype => {
          if (ctype.predefined) {
            ctype.text = $translate.instant(`SHIPMENT.CONTAINER_TYPES.${ctype.text}`);
          }
        });
        return containerTypes;
      });
  };

  return service;
}
