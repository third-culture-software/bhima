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
function create(req, res, next) {
  const sql = `INSERT INTO cost_center_allocation_basis SET ?`;
  const data = req.body;
  db.exec(sql, data)
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next);

}

// get details of specific allocation basis
//
// GET /cost_center_allocation_basis/:id
//
function read(req, res, next) {
  const sql = 'SELECT * FROM `cost_center_allocation_basis` WHERE id = ?';
  return db.one(sql, [req.params.id])
    .then(result => res.status(200).json(result))
    .catch(next);

}

// get details of all allocation bases
//
// GET /cost_center_allocation_basis
//
function list(req, res, next) {
  const sql = 'SELECT * FROM cost_center_allocation_basis ORDER BY name ASC;';
  return db.exec(sql, [])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

// update allocation basis details
//
// PUT /cost_center_allocation_basis/:id
//
function update(req, res, next) {
  const sql = 'UPDATE cost_center_allocation_basis SET ?  WHERE id = ?';
  const data = req.body;
  db.exec(sql, [data, req.params.id])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next);

}

// Delete a allocation basis
//
// DELETE /cost_center_allocation_basis/:id
//
function remove(req, res, next) {
  const sql = 'DELETE FROM cost_center_allocation_basis WHERE id = ?';
  db.exec(sql, req.params.id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
}
