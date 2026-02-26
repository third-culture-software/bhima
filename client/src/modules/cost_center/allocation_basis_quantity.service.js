angular.module('bhima.services')
  .service('AllocationBasisQuantityService', AllocationBasisQuantityService);

AllocationBasisQuantityService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class AllocationBasisQuantityService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /fee_center_allocation_basis_quantity/ URL.
 */
function AllocationBasisQuantityService(Api) {
  const service = new Api('/cost_center_allocation_basis_quantity/');

  service.bulkDetails = bulkDetails;
  service.bulkInsert = bulkInsert;
  service.bulkDelete = bulkDelete;
  service.bulkUpdate = bulkUpdate;
  service.updateQuantities = updateQuantities;

  /**
   *
   * @param id
   */
  function bulkDetails(id) {
    const url = `/cost_center_allocation_basis_quantity/bulk/${id}`;
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param params
   */
  function bulkInsert(params) {
    const url = '/cost_center_allocation_basis_quantity/bulk';
    return service.$http.post(url, { params })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param id
   * @param params
   */
  function bulkUpdate(id, params) {
    const url = `/cost_center_allocation_basis_quantity/bulk/${id}`;
    return service.$http.put(url, { params })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param id
   */
  function bulkDelete(id) {
    const url = `/cost_center_allocation_basis_quantity/bulk/${id}`;
    return service.$http.delete(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   */
  function updateQuantities() {
    const url = `/cost_center_allocation_basis_quantities_update`;
    return service.$http.put(url)
      .then(service.util.unwrapHttpResponse);
  }

  return service;
}
