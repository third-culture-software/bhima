/**
* Account Controller
*
* @description
* This controller exposes an API to the client for reading and writing Account Configurations
* used in the process of payroll.
*
* Root URL: /payroll/account_config/
*
* @requires lib/db
*/

const db = require('../../../lib/db');

// GET /payroll/account_configuration
function lookupAccountConfig(id) {
  const sql = `
    SELECT c.id, c.label, c.account_id
    FROM config_accounting AS c
    WHERE c.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll Accounts Configurations
async function list(req, res, next) {
  const sql = `
    SELECT c.id, c.label, c.account_id, a.number AS account_number, a.label AS account_label
    FROM config_accounting AS c
    JOIN account AS a ON a.id = c.account_id;
  `;

  try {
    const rows = await db.exec(sql);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
}

/**
* GET /payroll/account_configuration/:ID
*
* Returns the detail of a single Account
*/
async function detail(req, res, next) {
  const { id } = req.params;

  try {
    const record = await lookupAccountConfig(id);
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

// POST /payroll/account_configuration
async function create(req, res, next) {
  const sql = `INSERT INTO config_accounting SET ?`;
  const data = req.body;

  try {
    const row = await db.exec(sql, [data]);
    res.status(201).json({ id : row.insertId });
  } catch (err) {
    next(err);
  }

}

// PUT /payroll/account_configuration/:id
async function update(req, res, next) {
  const sql = `UPDATE config_accounting SET ? WHERE id = ?;`;

  try {
    await db.exec(sql, [req.body, req.params.id]);
    const record = await lookupAccountConfig(req.params.id);
    // all updates completed successfully, return full object to client
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

// delete /payroll/account_configuration/:id
function del(req, res, next) {
  db.delete(
    'config_accounting', 'id', req.params.id, res, next,
    `Could not find a Account Configuration with id ${req.params.id}`,
  );
}

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.delete = del;
