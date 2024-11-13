/**
* Function Controller
*
* This controller exposes an API to the client for reading and writing Function
*/

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');

// GET /Function
function lookupFunction(id) {
  const sql = `SELECT id, fonction_txt FROM fonction
    WHERE fonction.id = ?`;

  return db.one(sql, [id]);
}


// Lists the functions of hospital employees
function list(req, res, next) {
  const sql = `SELECT id, fonction_txt FROM fonction;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
* GET /Function/:ID
*
* Returns the detail of a single Function
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupFunction(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
}


// POST /Function
function create(req, res, next) {
  const sql = `INSERT INTO fonction SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next)
    
}


// PUT /Function /:id
function update(req, res, next) {
  const sql = `UPDATE fonction SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupFunction(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next)
    
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
