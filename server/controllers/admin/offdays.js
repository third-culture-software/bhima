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
function list(req, res, next) {
  const sql = `
    SELECT o.id, o.label, o.date, o.percent_pay FROM offday AS o;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /Offday/:ID
*
* Returns the detail of a single Offday
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupOffday(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /Offday
function create(req, res, next) {
  const sql = `INSERT INTO offday SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /Offday /:id
function update(req, res, next) {
  const sql = `UPDATE offday SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupOffday(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

}

// DELETE /Offday/:id
function del(req, res, next) {
  db.delete(
    'offday', 'id', req.params.id, res, next, `Could not find a Offday with id ${req.params.id}`,
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
