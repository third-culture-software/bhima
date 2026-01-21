/**
* @module function Controller
*
* @description
* This controller exposes an API to the client for reading and writing employee functions.
* functions are job positions in English.
*/

const db = require('../../lib/db');

// GET /function
function lookupFunction(id) {
  const sql = `SELECT id, fonction_txt FROM fonction WHERE fonction.id = ?`;
  return db.one(sql, [id]);
}

// Lists the functions of hospital employees and the number of employee
// associated with each function.
async function list(req, res) {
  const sql = `
    SELECT id, fonction_txt, COUNT(employee.uuid) as numEmployees
    FROM fonction LEFT JOIN employee ON fonction.id = employee.fonction_id
    GROUP BY fonction.id;
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /function/:id
*
* Returns the detail of a single function
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupFunction(id);
  res.status(200).json(record);
}

// POST /function
async function create(req, res) {
  const sql = `INSERT INTO fonction SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /function /:id
async function update(req, res) {
  const sql = `UPDATE fonction SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupFunction(req.params.id);
  res.status(200).json(record);
}

// DELETE /function/:id
async function del(req, res) {
  await db.delete(
    'fonction', 'id', req.params.id, res, `Could not find a fonction with id ${req.params.id}`,
  );
}

// get list of function
exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.delete = del;
