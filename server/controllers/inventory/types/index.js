const app = require('express').Router();
const db = require('../../../lib/db');

/**
 * POST /inventory/types
 *
 * @description
 * Create a new inventory types
 */
app.post('/', async (req, res) => {
  const sql = 'INSERT INTO inventory_type (text, description) VALUES (?, ?);';
  const row = await db.exec(sql, [req.body.text, req.body.description]);
  res.status(201).json({ id : row.insertId });
});

/**
 * GET /inventory/types
 *
 * @description
 * Get the list of inventory types
 */
app.get('/', async (req, res) => {
  const rows = await getTypes();
  res.status(200).json(rows);
});

/**
 * GET /inventory/types/:id
 *
 * @description
 * Get the specific type.
 */
app.get('/:id', async (req, res) => {
  const rows = await getTypes(req.params.id);
  res.status(200).json(rows);
});

/**
 * PUT /inventory/types/:id
 *
 * @description
 * Update the specific inventory type identified by id.
 */
app.put('/:id', async (req, res) => {
  const sql = 'UPDATE inventory_type SET ? WHERE id = ?;';
  await db.exec(sql, [req.body, req.params.id]);
  const rows = await getTypes(req.params.id);
  res.status(200).json(rows);
});

/**
 * DELETE /inventory/types/:id
 *
 * @description
 * Delete an inventory types.
 */
app.delete('/:id', async (req, res) => {
  const sql = 'DELETE FROM inventory_type WHERE id = ?;';
  await db.exec(sql, [req.params.id]);
  res.sendStatus(204);
});

/**
 * Get list of inventory types
 * @param {string} uid the type id is optional
 */
function getTypes(id) {
  const sql = `SELECT id, text, description, is_predefined FROM inventory_type ${id ? ' WHERE id = ?' : ''};`;
  return db.exec(sql, [id]);
}

module.exports = app;
