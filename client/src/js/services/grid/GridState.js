angular.module('bhima.services')
  .service('GridStateService', GridStateService);

GridStateService.$inject = [
  'util', 'appcache', 'NotifyService',
];

// responsible for -
// - caching grid state seperately for each grid
// - hooking into the grid api to apply the default size only when the grid is ready
// - exposing the methods to save and restore grid state
function GridStateService(util, AppCache, Notify) {
  /* @const */
  const stateCacheKey = 'gridState';

  function StateInstance(gridOptions, moduleCacheKey) {
    this._cacheKey = moduleCacheKey.concat(stateCacheKey);
    this._cache = new AppCache(this._cacheKey);

    util.after(gridOptions, 'onRegisterApi', (api) => {
      this._gridApi = api;

      this._gridApi.core.on.rowsRendered(null, util.once(() => {
        this.restoreGridState();
      }));
    });

    this.saveGridState = saveGridState.bind(this);
    this.restoreGridState = restoreGridState.bind(this);
    this.clearGridState = clearGridState.bind(this);
  }

  function saveGridState(notifyFlag) {
    const shouldNotify = angular.isDefined(notifyFlag) ? notifyFlag : true;

    if (this._gridApi) {
      this._cache.gridState = this._gridApi.saveState.save();

      if (shouldNotify) {
        Notify.success('FORM.INFO.GRID_STATE_SUCCESS');
      }
    }
  }

  function restoreGridState() {
    if (this._gridApi && this._cache.gridState) {
      this._gridApi.saveState.restore(null, this._cache.gridState);
    }
  }

  function clearGridState() {
    if (this._gridApi && this._cache.gridState) {
      this._cache.gridState = null;
    }
  }
  return StateInstance;
}
