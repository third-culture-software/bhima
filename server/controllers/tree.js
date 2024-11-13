/**
 * @overview Tree
 *
 * @description
 * This module is responsible for constructing each person's tree based on their
 * module/unit permissions in the database.
 *
 * @requires db
 */

const db = require('../lib/db');

// we assume the root node/unit has id 0
const ROOT_NODE = 0;

/**
 * @function generate
 *
 * @description
 * The HTTP handler that returns a user's tree based on their session
 * information.
 */
exports.generate = function generate(req, res, next) {
  buildTree(req.session.user.id)
    .then(treeData => {
      res.send(treeData);
    })
    .catch(next);

};

/**
 * @function getChildren
 *
 * @description
 * Recursive function that builds a nested tree of modules the user has access
 * too.
 *
 * @param {Array} units - the array of units/modules a user has permission to
 * @param {Number} parentId - the id of the parent node to group the children
 *   under.
 * @returns {Array} - the array of children for the parent node.
 */
function getChildren(units, parentId) {
  // Base case: There are no child units
  // Return null
  if (units.length === 0) { return null; }

  // Returns all units where the parent is the parentId
  const children = units.filter(unit => unit.parent === parentId);

  // Recursively call getChildren on all child units
  // and attach them as children of their parent unit
  children.forEach(unit => {
    unit.children = getChildren(units, unit.id);
  });

  return children;
}

/**
 * @function buildTree
 *
 * @description
 * Selects the permissions from the database and builds the user's tree.
 *
 * @param {Number} userId - the id of the user
 * @returns {Promise} - the built tree, if it exists.
 */
function buildTree(userId) {
  // NOTE
  // For this query to render properly on the client, the user
  // must also have permission to access the parents of leaf nodes

  const sql = `
    SELECT DISTINCT u.* FROM unit u
    JOIN role_unit as ru ON ru.unit_id = u.id
    JOIN user_role as ur ON  ru.role_uuid = ur.role_uuid
    WHERE ur.user_id =?`;

  return db.exec(sql, [userId])
    .then(units => {
    // builds a tree of units on the ROOT_NODE
      return getChildren(units, ROOT_NODE);
    });
}
