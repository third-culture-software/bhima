angular.module('bhima.components')
  .component('bhIprScale', {
    templateUrl : 'modules/templates/bhIprScale.tmpl.html',
    controller  : IprScaleController,
    bindings    : {
      onUpdate : '&',
    },
  });

IprScaleController.$inject = ['IprTaxService', 'AppCache', 'Store', 'NotifyService'];

/**
 * Ipr Scale Component
 * @param IprTaxes
 * @param AppCache
 * @param Store
 * @param Notify
 */
function IprScaleController(IprTaxes, AppCache, Store, Notify) {
  const ctrl = this;
  const cache = new AppCache('iprScale');

  this.$onInit = function $onInit() {
    IprTaxes.read()
      .then((iprTaxes) => {
        ctrl.iprTaxes = new Store();
        ctrl.iprTaxes.setData(iprTaxes);
        loadDefaultScale();
      })
      .catch(Notify.handleError);
  };

  ctrl.update = function update(scale) {
    if (scale) {
      ctrl.selectedScale = scale;

      // update cache with id to select this scale object on next load
      cache.selectedScaleId = scale.id;

      // update bindings
      ctrl.onUpdate({ scaleId : scale.id });
    }
  };

  /**
   *
   */
  function loadDefaultScale() {
    // if the cache exists - use that
    const cached = cache.selectedScaleId;
    if (cached) {
      ctrl.update(ctrl.iprTaxes.get(cached));
    }
  }
}
