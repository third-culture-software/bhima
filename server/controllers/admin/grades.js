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
async function list(req, res) {
  let sql = 'SELECT BUID(uuid) as uuid, text FROM grade ;';

  if (req.query.detailed === '1') {
    sql = 'SELECT BUID(uuid) as uuid, code, text, basic_salary FROM grade ;';
  }

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /grade/:uuid
*
* Returns the detail of a single Grade
*/
async function detail(req, res) {
  const record = await lookupGrade(req.params.uuid);
  res.status(200).json(record);
}

// POST /grade
async function create(req, res) {
  const data = req.body;
  const recordUuid = data.uuid || uuid();

  // Provide UUID if the client has not specified
  data.uuid = db.bid(recordUuid);

  const sql = 'INSERT INTO grade SET ? ';

  await db.exec(sql, [data]);
  res.status(201).json({ uuid : recordUuid });
}

// PUT /grade /:uuid
async function update(req, res) {
  const sql = 'UPDATE grade SET ? WHERE uuid = ?;';

  // make sure you cannot update the uuid
  delete req.body.uuid;

  const uid = db.bid(req.params.uuid);

  await db.exec(sql, [req.body, uid]);
  const grade = await lookupGrade(req.params.uuid);
  res.status(200).json(grade);
}

// DELETE /grade/:uuid
async function del(req, res, next) {
  try {
    const sql = 'DELETE FROM grade WHERE uuid = ?;';
    const uid = db.bid(req.params.uuid);

    const row = await db.exec(sql, [uid]);

    if (row.affectedRows === 0) {
      throw new NotFound(`Could not find a grade with uuid ${uid}`);
    }

    res.status(204).json();
  } catch (err) {
    next(err);
  }
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
