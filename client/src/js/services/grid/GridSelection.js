angular.module('bhima.services')
  .service('GridSelectionService', GridSelectionService);

GridSelectionService.$inject = ['util'];

/**
 *
 * @param util
 */
function GridSelectionService(util) {
  /**
   *
   * @param gridOptions
   */
  function GridSelection(gridOptions) {
    // key used to determine if multiple selected rows are in the same group
    this._uniqueKey = 'trans_id';
    this.selected = {
      groups : [],
    };

    this.gridOptions = gridOptions;

    util.after(gridOptions, 'onRegisterApi', api => {
      this._gridApi = api;
      this._gridApi.selection.on.rowSelectionChanged(null, selectedHookBatch.bind(this));
      this._gridApi.selection.on.rowSelectionChangedBatch(null, selectedHookBatch.bind(this));
    });
  }

  /**
   *
   */
  function updateSelectedGroups() {
    const currentSelection = this._gridApi.selection.getSelectedRows();
    const currentGroups = collapseRowsToGroups.bind(this)(currentSelection);
    this.selected.groups = currentGroups;
  }

  /**
   *
   */
  function selectedHookBatch() {
    updateSelectedGroups.call(this);
  }

  /**
   *
   * @param rows
   */
  function collapseRowsToGroups(rows) {
    const groups = {};

    rows.forEach(row => {
      groups[row[this._uniqueKey]] = groups[row[this._uniqueKey]] || [];
      groups[row[this._uniqueKey]].push(row);
    });

    return Object.keys(groups);
  }

  return GridSelection;
}
