/**
 * Inventory Units Controller
 * This controller is responsible for handling CRUD operations with inventory units
 */

const debug = require('debug')('bhima:inventory:units');
const router = require('express').Router();
const db = require('../../../lib/db');
const Forbidden = require('../../../lib/errors/Forbidden');

/**
 * GET /inventory/units
 *
 * @description
 * Get the list of inventory units.
 */
router.get('/', async (req, res) => {
  const rows = await getUnits();
  res.status(200).json(rows);
});

/**
 * PUT /inventory/units/:id
 *
 * @description
 * Create a new inventory units
 */
router.put('/:id', async (req, res) => {
  const result = await update(req.body, req.params.id);
  res.status(201).json(result);
});

/**
 * GET /inventory/units/:id
 *
 * @description
 * Get a single inventory unit by id.
 */
router.get('/:id', async (req, res) => {
  const rows = await getUnits(req.params.id);
  res.status(200).json(rows);
});

/**
 * DELETE /inventory/units/:id
 *
 * @description
 * Delete an inventory unit
 */
router.delete('/:id', async (req, res) => {
  await remove(req.params.id);
  res.sendStatus(204);
});

/**
 * POST /inventory/units
 *
 * @decription
 * Create a new inventory units
 */
router.post('/', async (req, res) => {
  debug('Creating inventory units');
  const id = await create(req.body);
  debug(`Created with id ${id}`);
  res.status(201).json({ id });
});

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

// expose module's methods
module.exports = router;
