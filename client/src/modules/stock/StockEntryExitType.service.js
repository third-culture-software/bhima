angular.module('bhima.services')
  .service('StockEntryExitTypeService', StockEntryExitTypeService);

StockEntryExitTypeService.$inject = ['StockModalService', '$q'];

/**
 * @param StockModal
 * @param $q
 */
function StockEntryExitTypeService(StockModal, $q) {
  const service = this;

  // each of these  defines a buttton on the stock entry or exit page. 
  const options = [{
    id: 1,
    label : 'patient',
    labelKey : 'PATIENT_REG.ENTITY',
    descriptionKey : 'STOCK.PATIENT_DISTRIBUTION',
    allowedKey : 'allow_exit_debtor',
    openSelectionModal : findPatientCallback,
    formatLabel : (entity) => `${entity.reference} - ${entity.display_name}`,
    page : 'exit'
  }, {
    id : 2,
    label : 'service',
    labelKey : 'SERVICE.ENTITY',
    descriptionKey : 'STOCK.SERVICE_DISTRIBUTION',
    allowedKey : 'allow_exit_service',
    openSelectionModal : findServiceCallback,
    formatLabel : (entity) => entity.name,
    page : 'exit'
  }, {
      id: 3,
    label : 'depot',
    labelKey : 'DEPOT.ENTITY',
    descriptionKey : 'STOCK.DEPOT_DISTRIBUTION',
    allowedKey : 'allow_exit_transfer',
    openSelectionModal: findDepotCallback,
    formatLabel : (entity) => entity.text,
    page : 'exit'
  }, {
      id: 4,
    label : 'loss',
    labelKey : 'STOCK.EXIT_LOSS',
    descriptionKey : 'STOCK.LOSS_DISTRIBUTION',
    allowedKey : 'allow_exit_loss',
    openSelectionModal: () => $q.resolve({ type : 'loss' }), // noop
    formatLabel : () => 'STOCK.LOSS_DISTRIBUTION',
    page : 'exit'
  }, {
    id : 5,
    label : 'purchase',
    labelKey : 'STOCK.ENTRY_PURCHASE',
    descriptionKey : 'STOCK_FLUX.FROM_PURCHASE',
    allowedKey : 'allow_entry_purchase',
    page : 'entry',
  }, {
      id: 6,
    label : 'integration',
    labelKey : 'STOCK.INTEGRATION',
    descriptionKey : 'STOCK_FLUX.FROM_INTEGRATION',
    allowedKey : 'allow_entry_integration',
    page : 'entry',
  }, {
      id: 7,
    label : 'donation',
    labelKey : 'STOCK.DONATION',
    descriptionKey : 'STOCK_FLUX.FROM_DONATION',
    allowedKey : 'allow_entry_donation',
    page : 'entry',
  }, {
      id: 8,
    label : 'transfer_reception',
    labelKey : 'STOCK.RECEPTION_TRANSFER',
    descriptionKey : 'STOCK_FLUX.FROM_TRANSFER',
    allowedKey : 'allow_entry_transfer',
    page : 'entry',
  }];


  service.exitTypes = options.filter(o => o.page === "exit");
  service.entryTypes = options.filter(o => o.page === "entry");

  service.options = options;

  service.getTypeById = (id) => options.find(type => type.id === id);

  service.filterTypesForDepot = (depot, types) => types.filter(type => depot[type.allowedKey]);

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
}
