const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.lookUp = lookUp;

exports.functionIndices = require('./functionIndice');
exports.gradeIndices = require('./gradeIndice');

function lookUp(options = {}) {
  const sql = `
    SELECT BUID(s.uuid) as uuid, BUID(g.uuid) as grade_uuid,
    s.created_at, p.display_name, g.code as code, g.text,  s.fonction_id,  f.fonction_txt,
      grade_indice, function_indice
    FROM staffing_indice s
    LEFT JOIN fonction f ON f.id = s.fonction_id
    JOIN grade g ON g.uuid = s.grade_uuid
    JOIN employee e ON e.uuid = s.employee_uuid
    JOIN patient p ON p.uuid = e.patient_uuid
  `;
  db.convert(options, ['uuid', 'grade_uuid', 'employee_uuid']);

  const filters = new FilterParser(options, { tableAlias : 's' });
  filters.equals('uuid');
  filters.equals('grade_uuid');
  filters.period('period', 'created_at');
  filters.dateFrom('custom_period_start', 'created_at');
  filters.dateTo('custom_period_end', 'created_at');

  filters.equals('fontion_id');
  filters.equals('employee_uuid');
  filters.setOrder('ORDER BY s.created_at, p.display_name, g.text, f.fonction_txt ASC');

  return db.exec(filters.applyQuery(sql), filters.parameters());
}

// retrieve all staffing indexes
async function list(req, res, next) {
  try {
    const rows = await lookUp(req.query);
    res.status(200).json(rows);
  } catch (e) {
    next(e);
  }
}

async function detail(req, res, next) {
  const sql = `
    SELECT BUID(uuid) as uuid, fonction_id, BUID(grade_uuid) as grade_uuid,
     BUID(employee_uuid) as employee_uuid, grade_indice, function_indice, created_at
    FROM staffing_indice
    WHERE uuid=?`;

  try {
    const indice = await db.one(sql, db.bid(req.params.uuid));
    res.status(200).json(indice);
  } catch (e) {
    next(e);
  }

}

// create a new staffing index
async function create(req, res, next) {
  const sql = `INSERT INTO staffing_indice SET ?`;
  const data = req.body;
  data.uuid = db.uuid();

  try {
    db.convert(data, ['uuid', 'grade_uuid', 'employee_uuid']);
    const rows = await db.exec(sql, data);
    res.status(201).json(rows);
  } catch (e) {
    next(e);
  }
}

// update a staffing index
async function update(req, res, next) {

  const staffingIndex = req.body;
  db.convert(staffingIndex, ['uuid', 'grade_uuid', 'employee_uuid']);

  delete staffingIndex.uuid;
  delete staffingIndex.created_at;

  staffingIndex.updated_at = new Date();

  const sql = `UPDATE staffing_indice SET ? WHERE uuid = ?`;
  try {
    const rows = await db.exec(sql, [staffingIndex, db.bid(req.params.uuid)]);
    res.status(200).json(rows);
  } catch (e) {
    next(e);
  }
}

// delete a staffing index
async function remove(req, res, next) {
  const binaryUuid = db.bid(req.params.uuid);
  const sql = `DELETE FROM staffing_indice WHERE uuid = ?`;
  try {
    const rows = await db.exec(sql, binaryUuid);
    res.status(200).json(rows);
  } catch (e) {
    next(e);
  }
}
