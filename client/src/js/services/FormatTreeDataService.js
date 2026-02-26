angular.module('bhima.services')
  .service('FormatTreeDataService', FormatTreeDataService);

FormatTreeDataService.$inject = [];

/**
 * @class FormatTreeDataService
 */
function FormatTreeDataService() {
  const service = this;

  service.formatStore = formatStore;
  service.getChildren = getChildren;
  service.flatten = flatten;
  service.order = order;

  /**
   *
   * @param data
   */
  function formatStore(data) {
    const storeData = order(data);
    return storeData;
  }

  /**
   * @function order
   * @description
   * Creates a proper Data list ordering by first creating a Data tree and
   * then flattening in place.
   * @param {Array} lists - a list of Data objects
   * @returns {Array} - the properly ordered list of Data objects
   */

  /**
   *
   * @param data
   */
  function order(data) {
    // NOTE: we assume the root node is 0
    const ROOT_NODE = 0;

    // build the Data list tree
    const tree = getChildren(data, ROOT_NODE);

    // return a flattened tree (in order)
    return flatten(tree);
  }

  /**
   * @param data
   * @param parentId
   * @function getChildren
   * @description
   * This method builds a tree data structure of Data and children of a
   * specified parentId.
   * @returns {Array} - an array of children
   */
  function getChildren(data, parentId) {
    // base case: There are no child element
    if (data.length === 0) { return null; }

    // returns all List where the parent is the
    // parentId
    const children = data.filter(handleParent);

    // recursively call getChildren on all child Data
    // and attach them as childen of their parent element
    children.forEach(handleChildren);

    /**
     *
     * @param element
     */
    function handleParent(element) {
      return element.parent === parentId;
    }

    /**
     *
     * @param element
     */
    function handleChildren(element) {
      element.children = getChildren(data, element.id);
    }

    return children;
  }

  /**
   * @param _tree
   * @param _depth
   * @function flatten
   * @description
   * Flattens a tree data structure (must have `children` property) in place.
   * @returns {Array} - the flattened array
   */
  function flatten(_tree, _depth) {
    const tree = _tree || [];
    let depth = (!angular.isDefined(_depth) || Number.isNaN(_depth)) ? -1 : _depth;
    depth += 1;

    /**
     *
     * @param array
     * @param node
     */
    function handleTreeLevel(array, node) {
      const items = [node].concat(node.children ? flatten(node.children, depth) : []);
      node.$$treeLevel = depth;
      return array.concat(items);
    }

    return tree.reduce(handleTreeLevel, []);
  }

  return service;
}
