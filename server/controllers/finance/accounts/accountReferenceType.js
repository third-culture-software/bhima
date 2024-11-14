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
function list(req, res, next) {
  const sql = `SELECT id, label, fixed FROM account_reference_type;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /account_reference_type/:ID
*
* Returns the detail of a single account_reference_type
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupAccountReferenceType(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /account_reference_type
function create(req, res, next) {
  const sql = `INSERT INTO account_reference_type SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /account_reference_type /:id
function update(req, res, next) {
  if (req.body.id) {
    delete req.body.id;
  }

  const sql = `UPDATE account_reference_type SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupAccountReferenceType(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

}

// DELETE /account_reference_type/:id
function remove(req, res, next) {
  const sql = `DELETE FROM account_reference_type WHERE id = ?;`;

  db.exec(sql, [req.params.id])
    .then((row) => {
    // if nothing happened, let the client know via a 404 error
      if (row.affectedRows === 0) {
        throw new NotFound(`Could not find an account reference type with id ${req.params.id}`);
      }

      res.status(204).json();
    })
    .catch(next);

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
