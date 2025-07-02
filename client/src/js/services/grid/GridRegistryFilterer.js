angular.module('bhima.services')
  .service('GridRegistryFilterer', GridRegistryFiltererService);

// dependencies injection
GridRegistryFiltererService.$inject = ['GridFilterer'];

function GridRegistryFiltererService(GridFilterer) {

  class GridRegistryFilterer {
    constructor(cacheKey = 'grid-registry-cache', defaultFilters = []) {
      this._filters = new GridFilterer(cacheKey, defaultFilters);
      this._latestViewFilters = {};
    }

    /**
     * @method search
     *
     * @description
     * This method call the given search modal function and apply
     * all necessary filters
     *
     * @param {function} fxSearchModal the search modal function
     * @param {function} fxLoad the load function
     */
    search(fxSearchModal, fxLoad) {
      const filtersSnapshot = this._filters.formatHTTP();
      fxSearchModal(filtersSnapshot)
        .then((changes) => {
          if (!changes) { return 0; }
          this._filters.replaceFilters(changes);
          this._filters.formatCache();
          return this.reload(fxLoad);
        });
    }

    /**
     * @method onRemoveFilter
     *
     * @description
     * This method updates filters after removing a filter
     *
     * @param {string} key the key of the filter
     * @param {function} fxLoad the load function
     */
    onRemoveFilter(key, fxLoad) {
      this._filters.remove(key);
      this._filters.formatCache();
      return this.reload(fxLoad);
    }

    /**
     * @method startup
     *
     * @description
     * Load data into the grid according filters in the cache
     *
     * @param {object} $stateParams the $state.params object
     * @param {function} fxLoad the load function
     */
    startup($stateParams, fxLoad) {
      if ($stateParams.length) {
        this._filters.replaceFiltersFromState($stateParams.filters);
        this._filters.formatCache();
      }
      return this.reload(fxLoad);
    }

    reload(fxLoad) {
      this._latestViewFilters = this._filters.formatView();
      return fxLoad(this._filters.formatHTTP(true));
    }

    formatHTTP() {
      return this._filters.formatHTTP();
    }

    latestViewFilters() {
      this._latestViewFilters = this._filters.formatView();
      return this._latestViewFilters;
    }

    getDisplayValueMap() {
      return this._filters.getDisplayValueMap();
    }

    get filters() { return this._filters; }
  }

  return GridRegistryFilterer;
}
