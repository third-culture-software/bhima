angular.module('bhima.services')
  .service('StockEntryExitTypeService', StockEntryExitTypeService);

StockEntryExitTypeService.$inject = ['StockModalService', '$q'];

/**
 *
 * @param StockModal
 * @param $q
 */
function StockEntryExitTypeService(StockModal, $q) {
  const service = this;

  service.exitTypes = [{
    label : 'patient',
    labelKey : 'PATIENT_REG.ENTITY',
    descriptionKey : 'STOCK.PATIENT_DISTRIBUTION',
    allowedKey : 'allow_exit_debtor',
    callback : findPatientCallback,
    formatLabel : (entity) => `${entity.reference} - ${entity.display_name}`,
  }, {
    label : 'service',
    labelKey : 'SERVICE.ENTITY',
    descriptionKey : 'STOCK.SERVICE_DISTRIBUTION',
    allowedKey : 'allow_exit_service',
    callback : findServiceCallback,
    formatLabel : (entity) => entity.name,
  }, {
    label : 'depot',
    labelKey : 'DEPOT.ENTITY',
    descriptionKey : 'STOCK.DEPOT_DISTRIBUTION',
    allowedKey : 'allow_exit_transfer',
    callback : findDepotCallback,
    formatLabel : (entity) => entity.text,
  }, {
    label : 'loss',
    labelKey : 'STOCK.EXIT_LOSS',
    descriptionKey : 'STOCK.LOSS_DISTRIBUTION',
    allowedKey : 'allow_exit_loss',
    callback : configureLossCallback,
    formatLabel : () => 'STOCK.LOSS_DISTRIBUTION',
  }];

  service.entryTypes = [{
    label : 'purchase',
    labelKey : 'STOCK.ENTRY_PURCHASE',
    descriptionKey : 'STOCK_FLUX.FROM_PURCHASE',
    allowedKey : 'allow_entry_purchase',
  }, {
    label : 'integration',
    labelKey : 'STOCK.INTEGRATION',
    descriptionKey : 'STOCK_FLUX.FROM_INTEGRATION',
    allowedKey : 'allow_entry_integration',
  }, {
    label : 'donation',
    labelKey : 'STOCK.DONATION',
    descriptionKey : 'STOCK_FLUX.FROM_DONATION',
    allowedKey : 'allow_entry_donation',
  }, {
    label : 'transfer_reception',
    labelKey : 'STOCK.RECEPTION_TRANSFER',
    descriptionKey : 'STOCK_FLUX.FROM_TRANSFER',
    allowedKey : 'allow_entry_transfer',
  }];

  /**
   *
   * @param depot
   * @param entityUuid
   */
  function findPatientCallback(depot, entityUuid) {
    return StockModal.openFindPatient({ entity_uuid : entityUuid });
  }

  /**
   *
   * @param depot
   * @param entityUuid
   */
  function findServiceCallback(depot, entityUuid) {
    return StockModal.openFindService({ depot, entity_uuid : entityUuid });
  }

  /**
   *
   * @param depot
   * @param entityUuid
   */
  function findDepotCallback(depot, entityUuid) {
    return StockModal.openFindDepot({ depot, entity_uuid : entityUuid });
  }

  /**
   *
   */
  function configureLossCallback() {
    return $q.resolve({ type : 'loss' });
  }
}
