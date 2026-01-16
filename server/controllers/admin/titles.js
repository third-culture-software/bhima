/**
* Title employee Controller
*
* This controller exposes an API to the client for reading and writing Function
*/

const db = require('../../lib/db');

// GET /title
function lookupTitle(id) {
  const sql = `SELECT id, title_txt, is_medical FROM title_employee
    WHERE title_employee.id = ?`;

  return db.one(sql, [id]);
}

// Lists the titles of hospital employees
async function list(req, res) {
  const sql = `SELECT id, title_txt, is_medical FROM title_employee;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /Title/:ID
*
* Returns the detail of a single Title
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupTitle(id);
  res.status(200).json(record);
}

// POST /title
async function create(req, res) {
  const sql = `INSERT INTO title_employee SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });

}

// PUT /Title /:id
async function update(req, res) {
  const sql = `UPDATE title_employee SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupTitle(req.params.id);
  res.status(200).json(record);
}

// DELETE /title/:id
function del(req, res, next) {
  db.delete(
    'title_employee', 'id', req.params.id, res, next, `Could not find a title with id ${req.params.id}`,
  );
}

// get list of title
exports.list = list;

// get details of a title
exports.detail = detail;

// create a new title
exports.create = create;

// update title informations
exports.update = update;

// Delete a title
exports.delete = del;
