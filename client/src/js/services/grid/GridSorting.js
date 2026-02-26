angular.module('bhima.services')
  .service('GridSortingService', GridSortingService);

/**
 * @class Grid Sorting Service
 * @description
 * This service is responsible for defining the global configuration for
 * sorting on the UI grids.  This the service provides a number
 * of utility methods used to sort on unique columns.
 */
function GridSortingService() {
  /**
   * This method is responsible for sorting transaction IDs that are generally
   * in the format ALPHA-NUMERIC for example 'TRANS100'. Sorting on a standard
   * string results in 90 being larger than 890 as this is a standard alphabetic
   * sort. This method sorts only the number.
   *
   * This sort assumes IDs will be in the format:
   * STRING INTEGER
   * @param {object}   a           The first object
   * @param {object}   b           The second object for comparison
   * @param {object}   rowA        UI Grid row storing all attributes of the first object
   * @param {object}   rowB        UI Grid row storing all attributes of the second object
   * @param {boolean}  direction   ASC or DESC
   * @returns {number}              An integer represeting this elements position relative to others, in
   *                               this case (compare sort) -1, 0, or 1
   */
  function transactionIds(a, b) {
    // determine integer (reference) value by extracting it from the transaction ID
    // match returns an array of mathces - take the first element
    const first = Number(/[a-z,A-Z]*([0-9]*)/g.exec(a)[1]);
    const second = Number(/[a-z,A-Z]*([0-9]*)/g.exec(b)[1]);

    if (first < second) {
      return 1;
    }

    if (first > second) {
      return -1;
    }

    return 0;
  }

  /**
   * This method is used to initialise the sorting service, it receives the
   * gridOptions object from the posting journal to be configured. It then
   * returns an object to expose the methods in the service.
   * @param {object} gridOptions - Angular UI Grid options object
   * @returns {Function} - Expose all methods from within service
   */
  function GridSorting() {
    this.transactionIds = transactionIds;
    this.sortByReference = sortByReference;
  }

  /**
   * @param a
   * @param b
   * @function sortByReferece
   * @description
   * Sorts references as if they were numerical values
   * @public
   */
  function sortByReference(a, b) {
    // get the last index of the dot in the reference (plus offset)
    const aIdx = a.lastIndexOf('.') + 1;
    const bIdx = b.lastIndexOf('.') + 1;

    // in case of malformed data, still try and sort
    try {
      // get the numerical value
      const aReference = parseInt(a.slice(aIdx), 10);
      const bReference = parseInt(b.slice(bIdx), 10);

      // return the correct numerical value
      return aReference - bReference;
    } catch (e) {
      return a.localeCompare(b);
    }
  }

  // bind all algorithms for public consumption
  GridSorting.algorithms = {
    sortByReference,
  };

  return GridSorting;
}
