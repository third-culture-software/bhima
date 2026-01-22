/**
 * Inventory Units Controller
 * This controller is responsible for handling CRUD operations with inventory units
 */

const debug = require('debug')('bhima:inventory:units');
const db = require('../../../lib/db');
const Forbidden = require('../../../lib/errors/Forbidden');

// expose module's methods
exports.list = list;
exports.details = details;
exports.create = create;
exports.update = update;
exports.remove = remove;

/** list inventory unit */
function list() {
  return getUnits();
}

/** details of inventory unit */
function details(identifier) {
  return getUnits(identifier);
}

/** create new inventory unit */
function create(record) {
  const sql = 'INSERT INTO inventory_unit (abbr, text) VALUES (?, ?);';
  /*
   * return a promise which can contains result or error which is caught
   * in the main controller (inventory.js)
   */
  return db.exec(sql, [record.abbr, record.text])
    .then(row => row.insertId);
}

/** update an existing inventory unit */
function update(record, id) {
  // Make sure we cannot update a pre-defined inventory unit
  return getUnits(id)
    .then(([dbRecord]) => {

      if (dbRecord.token) {
        debug(`Error: Attempt to modify a predefined inventory_unit definition id:${id}`);
        throw new Forbidden('Cannot modify a predefined inventory_unit definition');
      }

      // Do the update
      const sql = 'UPDATE inventory_unit SET ? WHERE id = ?;';
      return db.exec(sql, [record, id]);
    })
    .then(() => getUnits(id));
}

/** remove inventory unit */
function remove(id) {
  // Make sure we cannot delete a pre-defined inventory unit
  return getUnits(id)
    .then(([dbRecord]) => {
      if (dbRecord.token) {
        throw new Forbidden('Cannot delete a predefined inventory_unit definition');
      }

      const sql = 'DELETE FROM inventory_unit WHERE id = ?;';
      return db.exec(sql, [id]);
    });
}

/**
 * Get list of inventory units
 * @param {number} id - the unit id is optional
 */
function getUnits(id) {
  const sql = `SELECT id, abbr, text, token FROM inventory_unit ${id ? ' WHERE id = ?;' : ';'}`;
  return db.exec(sql, [id]);
}
