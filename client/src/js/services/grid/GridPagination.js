angular.module('bhima.services')
  .service('GridPaginationService', GridPaginationService);

GridPaginationService.$inject = [];

/**
 * Grid Pagination Service
 *
 * This service contains pagination configuration and utility methods for any
 * ui-grids. Custom pagination rules and functions are defined to ensure that
 * transactions are respected across pages (when grouped).
 *
 * @todo  Discuss if pagination should be encapsulated by TransactionService; this
 *        logic could be incorporated whilst loading transactions however this may result
 *        in too much responsibility.
 *
 * @todo  Discuss if pagination is required in an accountants workflow - how many
 *        rows are we expecting etc.
 */
function GridPaginationService() {
  /**
   * this variable configures the grid to use or ignore custom pagination;
   * true  - external (custom) pagination will be used, transactions are respected
   *         in page sizes calculated by the `fetchPage` function.
   * false - default (UI Grid) pagination is used, this does not respect transactions
   */
  const useExternalPagination = false;

  // variable used to track and share the current grids API object
  let gridApi;
  let serviceGridOptions;
  let serviceTransactions;

  /** @const */
  const paginationPageSizes = [25, 50, 75, 100];
  const paginationPageSize = 25;

  const paginationOptions = {
    pageNumber : 1,
    pageSize : paginationPageSize,
  };

  /**
   * This method returns a subset of data based
   * Known shortcomings :
   * - This method filters out transactions that overflow into the next page; if
   *   there are transactions bigger than a page it will return nothing
   * - Not all corner cases have been anticipated re: sorting/ filtering/ grouping
   *
   * @param newPage {object}   current page index
   * @param pageSize {object}  page size passed in from gridOptions
   */
  function fetchPage(newPage) {

    // Set the ideal page size to the configured limit - note the size only referers to transaction
    // elements, not header rows
    const { pageSize } = paginationOptions;

    // Get the current index into the data
    const currentRowIndex = (newPage - 1) * pageSize;

    // take an optimistic slice of the current data
    let data = serviceTransactions.slice(currentRowIndex, currentRowIndex + pageSize);

    const upperBound = currentRowIndex + pageSize;
    const upperBoundElement = serviceTransactions[upperBound];
    const comparisonElement = serviceTransactions[upperBound + 1];

    if (angular.isDefined(comparisonElement)) {
      if (upperBoundElement.trans_id === comparisonElement.trans_id) {

        // filter out this transaction id
        data = data.filter((row) => { return row.trans_id !== upperBoundElement.trans_id; });
      }
    }

    // update current subset of data
    serviceGridOptions.data = data;

    // update pagination view valuels
    serviceGridOptions.totalItems = serviceTransactions.length;
    serviceGridOptions.paginationPageSize = data.length;
    serviceGridOptions.paginationPageSizes = [data.length];
  }

  function paginationInstance(gridOptions, transactions) {
    const cacheGridApi = gridOptions.onRegisterApi;

    serviceGridOptions = gridOptions;
    serviceTransactions = transactions;

    gridOptions.onRegisterApi = (api) => {
      gridApi = api;

      // configure global pagination settings
      gridOptions.paginationPageSizes = paginationPageSizes;
      gridOptions.paginationPageSize = paginationPageSize;

      if (useExternalPagination) {
        gridOptions.useExternalPagination = true;

        // bind external pagination method
        gridApi.pagination.on.paginationChanged(null, fetchPage);

        // Setup initial page
        fetchPage(paginationOptions.pageNumber);
      }

      // call the method that had previously been registered to request the grids api
      if (angular.isDefined(cacheGridApi)) {
        cacheGridApi(api);
      }
    };
  }
  return paginationInstance;
}
