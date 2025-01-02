/**
* function Controller
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
async function list(req, res, next) {
  const sql = `
    SELECT id, fonction_txt, COUNT(employee.uuid) as numEmployees
    FROM fonction LEFT JOIN employee ON fonction.id = employee.fonction_id
    GROUP BY fonction.id;
  `;

  try {
    const rows = await db.exec(sql);
    res.status(200).json(rows);
  } catch (e) {
    next(e);
  }
}

/**
* GET /function/:id
*
* Returns the detail of a single function
*/
async function detail(req, res, next) {
  const { id } = req.params;

  try {
    const record = await lookupFunction(id);
    res.status(200).json(record);
  } catch (e) { next(e); }
}

// POST /function
async function create(req, res, next) {
  const sql = `INSERT INTO fonction SET ?`;
  const data = req.body;

  try {
    const row = await db.exec(sql, [data]);
    res.status(201).json({ id: row.insertId });
  } catch (e) { next(e); }
}

// PUT /function /:id
async function update(req, res, next) {
  const sql = `UPDATE fonction SET ? WHERE id = ?;`;

  try {
    await db.exec(sql, [req.body, req.params.id]);
    const record = await lookupFunction(req.params.id);
    res.status(200).json(record);
  } catch (e) { next(e); }
}

// DELETE /function/:id
function del(req, res, next) {
  db.delete(
    'fonction', 'id', req.params.id, res, next, `Could not find a function with id ${req.params.id}`,
  );
}

// get list of function
exports.list = list;

// get details of a function
exports.detail = detail;

// create a new function
exports.create = create;

// update function informations
exports.update = update;

// Delete a function
exports.delete = del;
