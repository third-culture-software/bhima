/**
 * Grade Controller
 *
 * This controller exposes an API to the client for reading and writing Grade
 */
const db = require('../../lib/db');
const { uuid } = require('../../lib/util');
const NotFound = require('../../lib/errors/NotFound');

// GET /Grade
function lookupGrade(uid) {
  const sql = `
    SELECT BUID(uuid) as uuid, code, text, basic_salary
    FROM grade
    WHERE grade.uuid = ?;
  `;

  return db.one(sql, [db.bid(uid)], uid, 'grade');
}

// Lists of grades of hospital employees.
function list(req, res, next) {
  let sql = 'SELECT BUID(uuid) as uuid, text FROM grade ;';

  if (req.query.detailed === '1') {
    sql = 'SELECT BUID(uuid) as uuid, code, text, basic_salary FROM grade ;';
  }

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
* GET /grade/:uuid
*
* Returns the detail of a single Grade
*/
function detail(req, res, next) {
  lookupGrade(req.params.uuid)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
}

// POST /grade
function create(req, res, next) {
  const data = req.body;
  const recordUuid = data.uuid || uuid();

  // Provide UUID if the client has not specified
  data.uuid = db.bid(recordUuid);

  const sql = 'INSERT INTO grade SET ? ';

  db.exec(sql, [data])
    .then(() => {
      res.status(201).json({ uuid : recordUuid });
    })
    .catch(next)
    
}

// PUT /grade /:uuid
function update(req, res, next) {
  const sql = 'UPDATE grade SET ? WHERE uuid = ?;';

  // make sure you cannot update the uuid
  delete req.body.uuid;

  const uid = db.bid(req.params.uuid);

  db.exec(sql, [req.body, uid])
    .then(() => lookupGrade(req.params.uuid))
    .then(record => {
      res.status(200).json(record);
    })
    .catch(next)
    
}

// DELETE /grade/:uuid
function del(req, res, next) {
  const sql = 'DELETE FROM grade WHERE uuid = ?;';

  db.exec(sql, [db.bid(req.params.uuid)])
    .then((row) => {
      // if nothing happened, let the client know via a 404 error
      if (row.affectedRows === 0) {
        throw new NotFound(`Could not find a grade with uuid ${db.bid(req.params.uuid)}`);
      }

      res.status(204).json();
    })
    .catch(next)
    
}

// get list of Grade
exports.list = list;

// get details of a Grade
exports.detail = detail;

// create a new Grade
exports.create = create;

// update grade informations
exports.update = update;

// Delete a Grade
exports.delete = del;
