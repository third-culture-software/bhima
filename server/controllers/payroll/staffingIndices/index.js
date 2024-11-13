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
function list(req, res, next) {
  lookUp(req.query)
    .then(rows => {
      res.status(200).json(rows);
    }).catch(next)
    
}

function detail(req, res, next) {
  const sql = `
    SELECT BUID(uuid) as uuid, fonction_id, BUID(grade_uuid) as grade_uuid,
     BUID(employee_uuid) as employee_uuid, grade_indice, function_indice, created_at
    FROM staffing_indice
    WHERE uuid=?`;

  db.one(sql, db.bid(req.params.uuid)).then(indice => {
    res.status(200).json(indice);
  }).catch(next);

}

// create a new staffing index
function create(req, res, next) {
  const sql = `INSERT INTO staffing_indice SET ?`;
  const data = req.body;
  data.uuid = db.uuid();
  db.convert(data, ['uuid', 'grade_uuid', 'employee_uuid']);

  db.exec(sql, data)
    .then(rows => {
      res.status(201).json(rows);
    })
    .catch(next);
}

// update a staffing index
function update(req, res, next) {

  const staffingIndex = req.body;
  db.convert(staffingIndex, ['uuid', 'grade_uuid', 'employee_uuid']);

  delete staffingIndex.uuid;
  delete staffingIndex.created_at;

  staffingIndex.updated_at = new Date();

  const sql = `UPDATE staffing_indice SET ? WHERE uuid = ?`;

  db.exec(sql, [staffingIndex, db.bid(req.params.uuid)])
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

// delete a staffing index
function remove(req, res, next) {
  const binaryUuid = db.bid(req.params.uuid);

  const sql = `DELETE FROM staffing_indice WHERE uuid = ?`;
  db.exec(sql, binaryUuid)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}
