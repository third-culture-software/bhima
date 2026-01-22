/**
* Offday Controller
*
* This controller exposes an API to the client for reading and writing Offday
*/

const db = require('../../lib/db');

// GET /Offday
function lookupOffday(id) {
  const sql = `
    SELECT o.id, o.label, o.date, o.percent_pay
    FROM offday AS o
    WHERE o.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll Offdays
async function list(req, res) {
  const sql = `
    SELECT o.id, o.label, o.date, o.percent_pay FROM offday AS o;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /Offday/:ID
*
* Returns the detail of a single Offday
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupOffday(id);
  res.status(200).json(record);
}

// POST /Offday
async function create(req, res) {
  const sql = `INSERT INTO offday SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /Offday /:id
async function update(req, res) {
  const sql = `UPDATE offday SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupOffday(req.params.id);
  res.status(200).json(record);

}

// DELETE /Offday/:id
async function del(req, res) {
  await db.delete(
    'offday', 'id', req.params.id, res, `Could not find a Offday with id ${req.params.id}`,
  );
}

// get list of Offday
exports.list = list;

// get details of a Offday
exports.detail = detail;

// create a new Offday
exports.create = create;

// update Offday informations
exports.update = update;

// Delete a Offday
exports.delete = del;
