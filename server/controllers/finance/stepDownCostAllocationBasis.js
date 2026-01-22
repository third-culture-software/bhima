const db = require('../../lib/db');

module.exports = {
  create,
  read,
  list,
  update,
  delete : remove,
};

// add a new allocation basis
//
// POST /cost_center_allocation_basis
//
async function create(req, res) {
  const sql = `INSERT INTO cost_center_allocation_basis SET ?`;
  const data = req.body;
  await db.exec(sql, data);
  res.sendStatus(201);
}

// get details of specific allocation basis
//
// GET /cost_center_allocation_basis/:id
//
async function read(req, res) {
  const sql = 'SELECT * FROM `cost_center_allocation_basis` WHERE id = ?';
  const result = await db.one(sql, [req.params.id]);
  res.status(200).json(result);
}

// get details of all allocation bases
//
// GET /cost_center_allocation_basis
//
async function list(req, res) {
  const sql = 'SELECT * FROM cost_center_allocation_basis ORDER BY name ASC;';
  const rows = await db.exec(sql, []);
  res.status(200).json(rows);

}

// update allocation basis details
//
// PUT /cost_center_allocation_basis/:id
//
async function update(req, res) {
  const sql = 'UPDATE cost_center_allocation_basis SET ?  WHERE id = ?';
  const data = req.body;
  await db.exec(sql, [data, req.params.id]);
  res.sendStatus(200);

}

// Delete a allocation basis
//
// DELETE /cost_center_allocation_basis/:id
//
async function remove(req, res) {
  const sql = 'DELETE FROM cost_center_allocation_basis WHERE id = ?';
  await db.exec(sql, req.params.id);
  res.sendStatus(204);
}
