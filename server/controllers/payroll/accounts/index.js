/**
* Account Controller
*
* This controller exposes an API to the client for reading and writing Account
*/

const db = require('../../../lib/db');

// GET /ACCOUNT_CONFIG
function lookupAccountConfig(id) {
  const sql = `
    SELECT c.id, c.label, c.account_id
    FROM config_accounting AS c
    WHERE c.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll Accounts Configurations
function list(req, res, next) {
  const sql = `
    SELECT c.id, c.label, c.account_id, a.number AS account_number, a.label AS account_label
    FROM config_accounting AS c
    JOIN account AS a ON a.id = c.account_id
  ;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /ACCOUNT_CONFIG/:ID
*
* Returns the detail of a single Account
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupAccountConfig(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /ACCOUNT_CONFIG
function create(req, res, next) {
  const sql = `INSERT INTO config_accounting SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /ACCOUNT_CONFIG /:ID
function update(req, res, next) {
  const sql = `UPDATE config_accounting SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupAccountConfig(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

}

// DELETE /ACCOUNT_CONFIG /:ID
function del(req, res, next) {
  db.delete(
    'config_accounting', 'id', req.params.id, res, next,
    `Could not find a Account Configuration with id ${req.params.id}`,
  );
}

// get list of Account
exports.list = list;

// get details of a Account
exports.detail = detail;

// create a new Account
exports.create = create;

// update Account informations
exports.update = update;

// Delete a Account
exports.delete = del;
