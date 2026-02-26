angular.module('bhima.services')
  .service('RoomService', RoomService);

RoomService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class RoomService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /rooms/ URL.
 */
function RoomService(Api) {
  const service = new Api('/rooms/');

  return service;
}
