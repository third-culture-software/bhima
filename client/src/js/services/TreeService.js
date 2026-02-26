/**
 * @class TreeService
 * @description
 * This file contains the generic class definition of a tree. A tree is defined
 * as an array of JSON objects having a parent key referring to another member
 * of the array.  The only exception is the root node, which should not be in
 * the tree.
 *
 * This code is also found (in a similar form) on the server in /lib/Tree.js
 */

class TreeService {
  constructor(data = [], options = {
    parentKey : 'parent',
    idKey : 'id',
    rootId : 0,
  }) {
    this._parentKey = options.parentKey || 'parent';
    this._idKey = options.idKey || 'id';

    // expose the data array for data binding
    this.data = angular.copy(data);

    // ensure that the root node is in the dataset
    this._rootNode = {
      label : 'ROOT',
    };

    // add identifier for root node
    this._rootNode[this._idKey] = 0;

    // build the tree with the provided root id and parentKey
    this._rootNode.children = this.buildTreeFromArray(this.data);
    this.buildNodeIndex();
  }

  id(node) {
    return node && node[this._idKey];
  }

  getRootNode() {
    return this._rootNode;
  }

  buildTreeFromArray(nodes, parentId = this.id(this._rootNode)) {
    // recursion base-case:  return nothing if empty array
    if (nodes.length === 0) { return null; }

    // find nodes which are the children of parentId
    const children = nodes.filter(node => node[this._parentKey] === parentId);

    // recurse - for each child node, compute their child-trees using the same
    // buildTreeFromArray() command
    children.forEach(node => {
      node.children = this.buildTreeFromArray(nodes, this.id(node));
    });

    // return the list of children
    return children;
  }

  buildNodeIndex() {
    this._nodeIndex = {};
    this.walk(node => {
      this._nodeIndex[this.id(node)] = node;
    });
  }

  prune(fn) {
    const markNodeToPruneFn = (node) => {
      node._toPrune = fn(node);
    };

    this.walk(childNode => markNodeToPruneFn(childNode));

    const original = this.toArray();
    const pruned = original.filter(node => !node._toPrune);

    // expose the data array for data binding
    this.data = pruned;

    // build the tree with the provided root id and parentKey
    this._rootNode.children = this.buildTreeFromArray(pruned);
    this.buildNodeIndex();

    return original.length - pruned.length;
  }

  toArray() {
    const array = [];
    this.walk((node) => array.push(node));
    return array;
  }

  /**
   * @function isRootNode
   * @description
   * Returns true if the node is the root node.
   * @param node {Object} - a tree node to compare.
   */
  isRootNode(node) {
    return this.id(node) === this.id(this._rootNode);
  }

  /**
   * @param ident
   * @function find
   * @description
   * Gets a node by its identifier.
   */
  find(ident) {
    if (ident === this.id(this._rootNode)) { return this._rootNode; }
    return this._nodeIndex[ident];
  }

  /**
   * @function walk
   * @description
   * Internal method to be used to walk through children, calling a function on
   * each child.  The caller can walk around the tree, calling a passed function
   * on either the ascending or the descending step.
   * @param fn {Function} - the function to call for each node in the tree
   * @param callFnBeforeRecurse {Boolean} - specify whether to call the function
   * on the descending or ascending direction of the recursion.  The descending
   * direction is before recursing through the children.  The ascending direction
   * is after all children have been looped through.
   * @param currentNode {Object} - the current node in the walk.
   * @param parentNode {Object} - the parent of the current node in the walk.
   */
  walk(fn, callFnBeforeRecurse = true, currentNode = this._rootNode, parentNode = null) {
    const callFnAfterRecurse = !callFnBeforeRecurse;

    const recurse = () => currentNode.children
      .forEach(childNode => this.walk(fn, callFnBeforeRecurse, childNode, currentNode));

    // if we start as the root node, then descend immediately.
    if (this.isRootNode(currentNode)) {
      recurse();
      return;
    }

    // if we are supposed to call the function before recursion, we do that now
    if (callFnBeforeRecurse) {
      fn(currentNode, parentNode);
    }

    // recursive step: walk through children
    recurse();

    // if we are supposed to call the function after recursion, now is the time
    if (callFnAfterRecurse) {
      fn(currentNode, parentNode);
    }
  }

  /**
   * @param comparisonFn
   * @function sort
   * @description
   * Sorts the child nodes in place by a provided comparison function.
   */
  sort(comparisonFn) {
    this.walk((childNode, parentNode) => parentNode.children.sort(comparisonFn));
    this.data = this.toArray();
  }
}

// common functions used throughout the application.
TreeService.common = {
  computeNodeDepth : (currentNode, parentNode) => {
    currentNode.depth = (parentNode.depth || 0) + 1;
  },

  sumOnProperty : (property, defaultValue = 0) => (currentNode, parentNode) => {
    parentNode[property] = (parentNode[property] || defaultValue) + currentNode[property];
  },
};

TreeService.$inject = [];

angular.module('bhima.services')
  .factory('TreeService', () => TreeService);
