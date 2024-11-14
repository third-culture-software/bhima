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
function list(req, res, next) {
  const sql = `SELECT id, title_txt, is_medical FROM title_employee;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /Title/:ID
*
* Returns the detail of a single Title
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupTitle(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /title
function create(req, res, next) {
  const sql = `INSERT INTO title_employee SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /Title /:id
function update(req, res, next) {
  const sql = `UPDATE title_employee SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupTitle(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

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
