angular.module('bhima.components')
  .component('bhDataCollector', {
    templateUrl : 'modules/templates/bhDataCollector.tmpl.html',
    controller  : DataCollectorController,
    bindings    : {
      onUpdate : '&',
    },
  });

DataCollectorController.$inject = ['DataCollectorManagementService', 'AppCache', 'Store', 'NotifyService'];

/**
 * Data Collector Controller
 * @param DataCollectorManagement
 * @param AppCache
 * @param Store
 * @param Notify
 */
function DataCollectorController(DataCollectorManagement, AppCache, Store, Notify) {
  const ctrl = this;
  const cache = new AppCache('dataCollectorManagement');

  this.$onInit = function $onInit() {
    DataCollectorManagement.read()
      .then((dataCollectors) => {
        ctrl.dataCollectors = new Store();
        ctrl.dataCollectors.setData(dataCollectors);
        loadDefaultDataCollector();
      })
      .catch(Notify.handleError);
  };

  ctrl.update = function update(dataCollector) {
    if (dataCollector) {
      ctrl.selectedDataCollector = dataCollector;

      // update cache with id to select this data Collector object on next load
      cache.selectedDataCollectorId = dataCollector.id;

      // update bindings
      ctrl.onUpdate({ dataCollectorId : dataCollector.id });
    }
  };

  /**
   *
   */
  function loadDefaultDataCollector() {
    // if the cache exists - use that
    const cached = cache.selectedDataCollectorId;
    if (cached) {
      ctrl.update(ctrl.dataCollectors.get(cached));
    }
  }
}
