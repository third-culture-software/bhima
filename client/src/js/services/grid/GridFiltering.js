angular.module('bhima.services')
  .service('GridFilteringService', GridFilteringService);

GridFilteringService.$inject = ['appcache', 'uiGridConstants', 'util', 'moment', 'bhConstants'];

/**
 * Grid Filter Service
 *
 * This service is responsible for defining the global configuration for
 * filtering for ui-grids.
 */
function GridFilteringService(AppCache, uiGridConstants, util, moment, bhConstants) {
  const serviceKey = '-Filtering';

  const DATE_FORMAT = bhConstants.dates.format.toUpperCase();

  function GridFiltering(gridOptions, cacheKey) {
    this.gridOptions = gridOptions;

    const cache = AppCache(cacheKey + serviceKey);
    this.cache = cache;

    // global filtering configuration
    // @FIXME(jniles): turned inline filtering off for the moment
    cache.enableFiltering = false;
    gridOptions.enableFiltering = cache.enableFiltering;

    // bind the grid API to the service
    util.after(gridOptions, 'onRegisterApi', (api) => {
      this.gridApi = api;
    });
  }

  /**
   * @method filterByDate
   *
   * @description
   * Matches the date string provided in the string using the date format
   * configured for the application.
   */
  GridFiltering.prototype.filterByDate = function filterByDate(searchValue, cellValue) {
    const cellDateString = moment(cellValue).format(DATE_FORMAT);
    return cellDateString.indexOf(searchValue.replace(/\\/g, '')) !== -1;
  };

  /**
   * @method toggleInlineFiltering
   *
   * @description
   * This method toggles the inline grid filters on the column headers of a grid.
   */
  GridFiltering.prototype.toggleInlineFiltering = function toggleInlineFiltering() {
    if (this.gridOptions.enableFiltering) {
      this.disableInlineFiltering();
    } else {
      this.enableInlineFiltering();
    }
  };

  /**
   * @method disableInlineFiltering
   *
   * @description
   * This method toggles off the inline grid filters on the column headers of a grid.
   */
  GridFiltering.prototype.disableInlineFiltering = function disableInlineFiltering() {
    if (!this.gridOptions) { return; }

    // skip if inline editing is currently off
    if (!this.gridOptions.enableFiltering) { return; }

    this.gridOptions.enableFiltering = false;
    this.cache.enableFiltering = false;

    this.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  /**
   * @method enableInlineFiltering
   *
   * @description
   * This method toggles on the inline grid filters on the column headers of a grid.
   */
  GridFiltering.prototype.enableInlineFiltering = function enableInlineFiltering() {
    if (!this.gridOptions) { return; }

    // skip if inline editing is currently on
    if (this.gridOptions.enableFiltering) { return; }

    this.gridOptions.enableFiltering = true;
    this.cache.enableFiltering = true;

    this.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  return GridFiltering;
}
