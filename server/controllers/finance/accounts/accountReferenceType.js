/**
* Account Reference Type Controller
*
* This controller exposes an API to the client for reading and writing Account Reference Type
*/

const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');

// GET /account_reference_type
function lookupAccountReferenceType(id) {
  const sql = `
    SELECT id, label, fixed FROM account_reference_type
    WHERE account_reference_type.id = ?`;

  return db.one(sql, [id]);
}

// Lists
async function list(req, res) {
  const sql = `SELECT id, label, fixed FROM account_reference_type;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /account_reference_type/:ID
*
* Returns the detail of a single account_reference_type
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupAccountReferenceType(id);
  res.status(200).json(record);

}

// POST /account_reference_type
async function create(req, res) {
  const sql = `INSERT INTO account_reference_type SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /account_reference_type /:id
async function update(req, res) {
  if (req.body.id) {
    delete req.body.id;
  }

  const sql = `UPDATE account_reference_type SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupAccountReferenceType(req.params.id);
  // all updates completed successfull, return full object to client
  res.status(200).json(record);
}

// DELETE /account_reference_type/:id
async function remove(req, res) {
  const sql = `DELETE FROM account_reference_type WHERE id = ?;`;

  const row = await db.exec(sql, [req.params.id]);
  // if nothing happened, let the client know via a 404 error
  if (row.affectedRows === 0) {
    throw new NotFound(`Could not find an account reference type with id ${req.params.id}`);
  }

  res.status(204).json();
}

// get list of accountReferenceType
exports.list = list;

// get details of a accountReferenceType
exports.detail = detail;

// create a new accountReferenceType
exports.create = create;

// update accountReferenceType informations
exports.update = update;

// Delete a accountReferenceType
exports.delete = remove;
