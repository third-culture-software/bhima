angular.module('bhima.services')
  .service('GridEditorService', GridEditorService);

GridEditorService.$inject = ['util'];

function GridEditorService(util) {

  /**
   * @constructor
   */
  function GridEditors(gridOptions) {

    this.gridOptions = gridOptions;
    this.authenticated = false;

    util.after(gridOptions, 'onRegisterApi', (api) => {
      this.api = api;

      this.api.edit.on.beginCellEdit(null, (row, column) => {
        // noop()
      });

      // notify that edits have been canceled
      this.api.edit.on.cancelCellEdit(null, (row, column) => {
        // noop()
      });

      this.api.edit.on.afterCellEdit(null, (row, column) => {
        // noop()
      });

    });
  }

  /**
   * @method requestUserAuthentication
   *
   * @description
   * This method will use the user authentication modal to authenticate a
   * user's edit session.  It is currently unimplemented.
   */
  GridEditors.prototype.requestUserAuthentication = function requestUserAuthentication() {
    // noop()
  };

  return GridEditors;
}
