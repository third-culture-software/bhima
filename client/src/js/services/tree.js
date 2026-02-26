/**
 * User Modules (Tree) Service
 * Provides methods for accessing modules that the user is subscribed to
 * and formatting them for display in the tree navigation.
 * @todo End to end tests to ensure the service is always returning
 * expected results
 */
angular.module('bhima.services')
  .service('Tree', Tree);

Tree.$inject = ['$http', '$translate', 'util', 'TreeService'];

/**
 *
 * @param $http
 * @param $translate
 * @param util
 * @param TreeClass
 */
function Tree($http, $translate, util, TreeClass) {
  const service = this;

  /** fetch all units available to the current user. */
  service.units = units;
  service.all = all;
  service.sortByTranslationKey = sortByTranslationKey;

  /**
   *
   */
  function units() {
    return $http.get('/tree')
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   */
  function all() {
    return $http.get('/units')
      .then(util.unwrapHttpResponse)
      .then(data => new TreeClass(data));
  }

  // returns 1 if unit is a parent or 0 if not.
  /**
   *
   * @param unit
   */
  function hasChildren(unit) {
    const bool = unit.children && unit.children.length > 0;
    return bool ? 1 : 0;
  }

  /**
   * @param unitArray
   * @function sortByTranslationKey
   * @description
   * Recursively sort an array of BHIMA units respecting translation keys.
   */
  function sortByTranslationKey(unitArray) {
    if (angular.isUndefined(unitArray)) {
      return;
    }

    unitArray.sort((a, b) => {
      const aValue = $translate.instant(a.key);
      const bValue = $translate.instant(b.key);

      // make sure parents sink to the bottom of the sorted list.
      const parentWeight = (hasChildren(a) - hasChildren(b));

      // prioritize sorting by parents, then by i18nValue
      return (parentWeight || aValue.localeCompare(bValue));
    });

    // recursively step into each set of children
    unitArray.forEach(node => {
      if (angular.isDefined(node.children)) {
        sortByTranslationKey(node.children);
      }
    });
  }

}
