angular.module('bhima.services')
  .service('GridColumnService', GridColumnService);

GridColumnService.$inject = [
  'uiGridConstants', 'AppCache', '$uibModal', 'util', '$translate',
];

/**
 * @param uiGridConstants
 * @param AppCache
 * @param Modal
 * @param util
 * @param $translate
 * @module services/grid/GridColumnService
 * @description
 * This service is responsible for setting up the column show/hiding on a
 * ui-grid.  When the service is first initialized, the default visibility is
 * inferred from the grid columns (on grid rendering).  If a cache exists for
 * the grid, the grid's column are loaded from the cache.
 *
 * At any point, a module (usually a modal) can call instance.resetDefaults()
 * to restore the default column rendering from the grid.
 * @todo - investigate using ui-grid-saveState for caching the column
 */
function GridColumnService(uiGridConstants, AppCache, Modal, util, $translate) {
  /** @constant cache alias for this service */
  // const serviceKey = '-Columns';

  /**
   * @function cacheDefaultColumnVisibility
   * @description
   * Called once in the constructor of the column service.  It digests the
   * grid's columns and sets the default visibility object.
   * @param {object} api - the ui-grid's api passed in from rowsRendered()
   * @private
   */
  function cacheDefaultColumnVisibility(api) {
    // ensure that this method doesn't get called multiple times by checking if
    // this.defaults is set.
    if (Object.keys(this.defaults).length > 0) { return; }

    const { defaults } = this;

    angular.forEach(this.gridOptions.columnDefs, (defn) => {
      const { field } = defn;

      // only use the fields have usable names
      if (field) {
        const column = api.grid.getColumn(field);

        // cache the default visible value
        defaults[field] = column.visible;
      }
    });
  }

  /**
   * @param gridOptions
   * @function Columns
   * @description
   * The constructor of the GridColumnsService.  It is called with the
   * gridOptions and a cacheKey to determine where to store the column
   * visibility selection for future page refreshes.
   */
  function Columns(gridOptions) {
    // bind access to the gridOptions
    this.gridOptions = gridOptions;
    this.defaults = {};

    // bind the exposed grid API
    util.after(gridOptions, 'onRegisterApi', (api) => {
      this.gridApi = api;

      // when the rendering is complete, cache the default column visibility
      api.core.on.rowsRendered(null, cacheDefaultColumnVisibility.bind(this));
    });
  }

  /**
   * returns [{field1 : displayName1}, {field2 : displayName2}, ...]
   * this function is useful for renaming keys
   */
  Columns.prototype.getDisplayNames = function getDisplayNames() {
    const displayNames = {};
    this.gridOptions.columnDefs.forEach(col => {
      displayNames[col.field] = $translate.instant(col.displayName);
    });
    return displayNames;
  };
  /**
   * @function setVisibleColumns
   * @description
   * This method takes a map of fields -> visibility and sets the column visibility
   * based on that.  It redraws the grid once all columns have been toggled.
   * @param {object} columns - a mapping of field names to boolean visibility values
   */
  Columns.prototype.setVisibleColumns = function setVisibleColumns(columns) {
    const { grid } = this.gridApi;

    angular.forEach(columns, (visible, field) => {
      const column = grid.getColumn(field);
      if (visible) {
        column.showColumn();
      } else {
        column.hideColumn();
      }
    });

    // redraw the grid
    this.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  /**
   * @param columns
   * @function hasEnoughColumns
   * @description
   * This structure is used to count the number of selected columns
   */
  Columns.prototype.hasEnoughColumns = function hasEnoughColumns(columns) {
    const { grid } = this.gridApi;
    let visibleColumns = 0;

    const skipColumnNames = ['selectionRowHeaderCol', 'treeBaseRowHeaderCol'];

    // loop through columns, counting those that aren't matched by skipColumnNames
    angular.forEach(columns, (visible, field) => {
      const column = grid.getColumn(field);
      if (skipColumnNames.includes(column.name)) { return; }
      if (visible) {
        visibleColumns++;
      }
    });

    return visibleColumns > 0;
  };

  /**
   * @function resetDefaultVisibility
   * @description
   * Resets the column visibility to the original visibility defined in the
   * controller.
   */
  Columns.prototype.resetDefaultVisibility = function resetDefaultVisibility() {
    this.setVisibleColumns(this.defaults);
  };

  /**
   * @function getColumns
   * @description
   * Utility method to allow columns to be shared around with other services
   * and/or controllers.
   * @returns {Array} columns - an array of column definitions from the grid
   *   core.
   */
  Columns.prototype.getColumns = function getColumns() {
    return this.gridApi.grid.columns.filter(col => col.field !== 'selectionRowHeaderCol');
  };

  /**
   * @function getColumnVisibilityMap
   * @description
   * Utility method to get the visibility profile of grid columns.
   * @returns {object} map - a mapping of column field names to visibility status
   */
  Columns.prototype.getColumnVisibilityMap = function getColumnVisibilityMap() {
    return this.getColumns().reduce((map, column) => {
      map[column.field] = column.visible;
      return map;
    }, {});
  };

  /**
   * @function openConfigurationModal
   * @description
   * This class method allows any module to open a column configuration modal in
   * the context of their grid's column configuration.
   * @returns {Promise} - resolve the modal's close/open state
   */
  Columns.prototype.openConfigurationModal = function openConfigurationModal() {
    const self = this;
    const modal = Modal.open({
      templateUrl : 'modules/templates/modals/columnConfig.modal.html',
      controller :  'ColumnsConfigModalController as ColumnsConfigModalCtrl',
      size : 'lg',
      resolve : { Columns : () => self },
    });

    return modal.result;
  };

  return Columns;
}
