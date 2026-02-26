angular.module('bhima.components')
  .component('bhCheckboxTree', {
    templateUrl : 'js/components/bhCheckboxTree/bhCheckboxTree.html',
    controller  : bhCheckboxTreeController,
    bindings    : {
      data : '<',
      checkedIds : '<?',
      disabledIds : '<?',
      onChange : '&',
      idKey : '@?',
      labelKey : '@?',
      parentKey : '@?',
      isFlatTree : '@?',
    },
  });

bhCheckboxTreeController.$inject = ['TreeService'];

/**
 *
 * @param Tree
 */
function bhCheckboxTreeController(Tree) {
  const $ctrl = this;

  const DEFAULT_ID_KEY = 'id';
  const DEFAULT_LABEL_KEY = 'label';
  const DEFAULT_PARENT_KEY = 'parent';

  $ctrl.$onInit = () => {
    $ctrl.idKey = $ctrl.idKey || DEFAULT_ID_KEY;
    $ctrl.labelKey = $ctrl.labelKey || DEFAULT_LABEL_KEY;
    $ctrl.parentKey = $ctrl.parentKey || DEFAULT_PARENT_KEY;

    $ctrl.disabledIds = $ctrl.disabledIds || [];

    if ($ctrl.data) {
      buildTree($ctrl.data);
    }
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.data && changes.data.currentValue) {
      buildTree(changes.data.currentValue);
    }

    if (changes.disabledIds && changes.disabledIds.currentValue) {
      processDisabledIds();
      getCheckedNodes();
    }

    if (changes.checkedIds && changes.checkedIds.currentValue) {
      if (!angular.equals(changes.checkedIds.currentValue, changes.checkedIds.previousValue)) {
        processCheckedIds();
        getCheckedNodes();
      }
    }
  };

  /**
   *
   */
  function processDisabledIds() {
    // ensure that disabled ids are an array
    if (!Array.isArray($ctrl.disabledIds) || $ctrl.data.length === 0) {
      return;
    }

    // ensure that the mask is a cloned array
    const mask = [...$ctrl.disabledIds];

    // loop through and set the disabled property on the checkbox
    mask
      .filter(id => id !== $ctrl.tree.id($ctrl.root))
      .forEach(id => {
        const node = $ctrl.tree.find(id);
        if (!node) { return; }
        node._disabled = true;
      });
  }

  /**
   *
   */
  function processCheckedIds() {
    // ensure that checked ids are an array
    if (!Array.isArray($ctrl.checkedIds) || $ctrl.data.length === 0) {
      return;
    }

    // ensure that the mask is a cloned array
    const mask = [...$ctrl.checkedIds];

    // initially, we won't use setNodeValue since we just want to make those as checked
    // that the mask sets as checked, not parent/child nodes.
    mask
      .filter(id => id !== $ctrl.tree.id($ctrl.root))
      .forEach(id => {
        const node = $ctrl.tree.find(id);
        if (!node) { return; }
        if (node._disabled) { return; }
        node._checked = true;
      });
  }

  /**
   *
   * @param array
   */
  function buildTree(array = []) {
    const data = [...array];

    // make easier template labels and default values to checked is false
    data.forEach(node => {
      node._label = node[$ctrl.labelKey];
      node._checked = false;
      node._disabled = false;

      // work on flat arrays by faking a tree
      if (angular.isDefined($ctrl.isFlatTree)) { node[$ctrl.parentKey] = 0; }
    });

    // create the tree
    $ctrl.tree = new Tree(data, { parentKey : $ctrl.parentKey, rootId : 0, idKey : $ctrl.idKey });
    $ctrl.root = $ctrl.tree.getRootNode();

    // compute node depths
    $ctrl.tree.walk(Tree.common.computeNodeDepth);

    processCheckedIds();
  }

  /**
   * @function getCheckedNodes
   * @description
   * Called on every toggle to recompile the list of checked nodes.  It calls
   * the callback with the list of checked nodes.
   */
  function getCheckedNodes() {
    const checked = [];

    $ctrl.tree.walk(node => { if (node._checked) { checked.push($ctrl.tree.id(node)); } });

    const offset = $ctrl.disabledIds ? $ctrl.disabledIds.length : 0;

    // since disabled nodes cannot be checked, remove them from the count
    // this allows the toggle on the root node to function correctly.
    const numCheckableNodes = ($ctrl.data.length - offset);

    // toggle the root node if all child nodes are checked
    $ctrl.root._checked = checked.length === numCheckableNodes;

    // fire the callback.
    $ctrl.onChange({ data : checked });
  }

  // helper function to figure out if a node has children
  /**
   *
   * @param node
   */
  function isParentNode(node) {
    return node.children && node.children.length > 0;
  }

  /**
   * @function setNodeValue
   * @param {object} node - the node in the tree
   * @param {boolean} isChecked - a boolean value to set the node to
   * @description
   * This function sets a node's value to the isChecked parameter.  It also sets
   * any children to the same value if it is a parent node.  Finally, it will
   * check to make sure the parent is automatically checked if needed.
   */
  $ctrl.setNodeValue = setNodeValue;
  /**
   *
   * @param node
   * @param isChecked
   */
  function setNodeValue(node, isChecked) {

    const isRootNode = $ctrl.tree.isRootNode(node);

    // set the value of the node to isChecked
    if (!node._disabled || isRootNode) {
      node._checked = isChecked;
    }

    // recursively update all child nodes.
    if (isParentNode(node)) {
      node.children.forEach(child => setNodeValue(child, isChecked));
    }

    // make sure the parent is toggled if all children are toggled
    if (!isRootNode) {
      updateParentNodeCheckedState(node.parent);
    }

    getCheckedNodes();
  }

  /**
   * @function updateParentNodeCheckedState
   * @description
   * This function will check the parent node if some child is checked.
   * Otherwise, the parent will be unchecked.
   * @param {number} parentId - the id of a node in the tree
   */
  function updateParentNodeCheckedState(parentId) {
    const node = $ctrl.tree.find(parentId);

    // the state root node cannot be set by this function since it is
    // only set if _all_ underlying nodes are true.  That check is performed
    // in the getCheckedNodes() function.
    if ($ctrl.tree.isRootNode(node)) { return; }

    // check if a child node is checked
    const isChecked = node.children.some(child => child._checked);

    if (!node._disabled) {
      node._checked = isChecked;
    }

    // recurse up to root
    updateParentNodeCheckedState(node.parent);
  }

}
