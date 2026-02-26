angular.module('bhima.services')
  .service('RequisitionHelperService', RequisitionHelperService);

RequisitionHelperService.$inject = ['StockService'];

/**
 * @param Stock
 * @function RequisitionHelperService
 * @description
 * This function combines shared options from the FindDepot and FindService modals
 * into a single file to not repeat code.
 */
function RequisitionHelperService(Stock) {

  const service = this;

  /**
   * @param reference
   * @function lookupRequisitionByReference
   * @description
   * This function looks up the requisition by the reference and asserts that
   * the requisition is available for use.  If it passes checks, the requisition
   * API is queried again with the balance check.
   */
  function lookupRequisitionByReference(reference) {
    return Stock.stockRequisition.read(null, { reference })
      .then(([requisition]) => {

        // check that the requisition actually exists
        if (!requisition || !requisition.uuid) {
          const err = new Error('REQUISITION.VOUCHER_NOT_FOUND');
          err.label = 'label label-warning';
          throw err;
        }

        // check that the requisition is available to use
        const statuses = ['done', 'completed', 'excessive'];
        if (statuses.includes(requisition.status_key)) {
          const err = new Error('REQUISITION.ALREADY_USED');
          err.label = 'label label-success';
          throw err;
        }

        // check that the requisition hasn't been canceled
        if (requisition.status_key === 'cancelled') {
          const err = new Error('REQUISITION.CANCELLED');
          err.label = 'label label-danger';
          throw err;
        }

        return Stock.stockRequisition.read(requisition.uuid, { balance : true });
      });
  }

  /**
   * @param requisition
   * @param depot
   * @function isRequisitionForDepot
   * @description
   * Checks if the requisition is for the correct depot and sets the appropriate
   * error flags if not.
   */
  function isRequisitionForDepot(requisition, depot) {
    if (depot.uuid !== requisition.depot_uuid) {
      const err = new Error('REQUISITION.NOT_FOR_DEPOT');
      err.label = 'label label-warning';
      throw err;
    }
    return requisition;
  }

  /**
   * @param requisition
   * @param reqService
   * @function isRequisitionForService
   * @description
   * Checks if the requisition is for the correct service and sets the appropriate
   * error flags if not.
   */
  function isRequisitionForService(requisition, reqService) {
    if (!reqService || !reqService.uuid) {
      const err = new Error('REQUISITION.NOT_FOR_SERVICE');
      err.label = 'label label-warning';
      throw err;
    }
    return requisition;
  }

  // bind functions/properties to service
  Object.assign(service, {
    lookupRequisitionByReference,
    isRequisitionForDepot,
    isRequisitionForService,
  });

  return service;

}
