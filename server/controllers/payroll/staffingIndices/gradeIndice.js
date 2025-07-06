const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.delete = remove;
exports.lookUp = lookUp;

exports.listRubricsGrade = listRubricsGrade;
exports.detailRubricsGrade = detailRubricsGrade;
exports.createRubricsGrade = createRubricsGrade;
exports.updateRubricsGrade = updateRubricsGrade;
exports.deleteRubricsGrade = deleteRubricsGrade;

exports.listRubricsGradeEmployee = listRubricsGradeEmployee;

// retrieve all staffing indexes
async function list(req, res) {
  const staffingGradeIndices = await lookUp(req.query);
  res.json(staffingGradeIndices);
}

async function listRubricsGradeEmployee(req, res) {
  const sql = `
    SELECT rgi.rubric_id, rgi.value
    FROM employee AS emp
    JOIN patient AS pa ON pa.uuid = emp.patient_uuid
    JOIN rubric_grade_indice AS rgi ON rgi.grade_uuid = emp.grade_uuid
    JOIN rubric_payroll AS rb ON rb.id = rgi.rubric_id
    WHERE emp.uuid = ?;
  `;

  const rubrics = await db.exec(sql, [db.bid(req.query.employee_uuid)]);
  res.status(200).json(rubrics);
}

async function detail(req, res) {
  const sql = `
    SELECT BUID(uuid) as uuid, value, BUID(grade_uuid) as grade_uuid
    FROM staffing_grade_indice
    WHERE uuid = ?`;

  const staffingGradeIndice = await db.one(sql, db.bid(req.params.uuid));
  res.status(200).json(staffingGradeIndice);
}

// create a new staffing_grade_indice
// TODO(@jniles) - this should return 201 and the uuid
async function create(req, res) {
  const sql = `INSERT INTO staffing_grade_indice  SET ?`;

  const staffingGradeIndice = req.body;
  staffingGradeIndice.uuid = staffingGradeIndice.uuid ? staffingGradeIndice.uuid : db.uuid();

  db.convert(staffingGradeIndice, ['uuid', 'grade_uuid']);

  await db.exec(sql, staffingGradeIndice);
  res.sendStatus(201);
}

// update a staffing_grade_indice
async function update(req, res) {
  db.convert(req.body, ['uuid', 'grade_uuid']);

  const staffingGradeIndice = req.body;
  delete staffingGradeIndice.uuid;

  const sql = `UPDATE staffing_grade_indice  SET ? WHERE uuid = ?`;

  const staffingGradeIndices = await db.exec(sql, [staffingGradeIndice, db.bid(req.params.uuid)]);
  res.status(200).json(staffingGradeIndices);
}

// delete a staffing_grade_indice
async function remove(req, res) {
  const id = db.bid(req.params.uuid);

  const sql = `DELETE FROM staffing_grade_indice WHERE uuid = ?`;
  await db.exec(sql, id);
  res.sendStatus(200);
}

function lookUp(options = {}) {
  const sql = `
    SELECT BUID(s.uuid) as uuid, s.value, BUID(s.grade_uuid) as grade_uuid,
      g.code as grade_code, g.text as grade_text, g.basic_salary as grade_basic_salary
    FROM staffing_grade_indice AS s 
      JOIN grade as g ON g.uuid = s.grade_uuid
  `;

  db.convert(options, ['uuid', 'grade_uuid']);
  const filters = new FilterParser(options, { tableAlias : 's' });

  filters.equals('uuid');
  filters.equals('value');
  filters.equals('grade_uuid');
  filters.setOrder('ORDER BY g.text ASC');

  return db.exec(filters.applyQuery(sql), filters.parameters());
}

// retrieve all staffing indexes
async function listRubricsGrade(req, res) {
  const staffingGradeIndices = await lookUpRubricsGrade(req.query);
  res.json(staffingGradeIndices);
}

async function detailRubricsGrade(req, res) {
  const sql = `
    SELECT BUID(uuid) as uuid, value, BUID(grade_uuid) as grade_uuid
    FROM staffing_grade_indice WHERE uuid = ?
  `;

  const staffingGradeIndice = await db.one(sql, db.bid(req.params.uuid));
  res.status(200).json(staffingGradeIndice);
}

// create a new staffing_grade_indice
async function createRubricsGrade(req, res) {
  const sql = `INSERT INTO rubric_grade_indice  SET ?`;

  const gradeIndice = req.body.data;
  gradeIndice.uuid = gradeIndice.uuid ? gradeIndice.uuid : db.uuid();

  db.convert(gradeIndice, ['uuid', 'grade_uuid']);

  await db.exec(sql, gradeIndice);
  res.sendStatus(201);
}

// update a staffing_grade_indice
async function updateRubricsGrade(req, res) {
  db.convert(req.body, ['uuid', 'grade_uuid']);

  const gradeIndice = req.body;
  delete gradeIndice.uuid;

  const sql = `UPDATE rubric_grade_indice  SET ? WHERE uuid = ?`;

  const gradeIndices = await db.exec(sql, [gradeIndice, db.bid(req.params.uuid)]);
  res.status(200).json(gradeIndices);
}

// delete a staffing_grade_indice
async function deleteRubricsGrade(req, res) {
  const sql = `DELETE FROM rubric_grade_indice WHERE uuid = ?`;
  await db.exec(sql, db.bid(req.params.uuid));
  res.sendStatus(200);
}

function lookUpRubricsGrade(options = {}) {
  const sql = `
    SELECT BUID(rgi.uuid) as uuid, rgi.rubric_id, rgi.value, BUID(rgi.grade_uuid) as grade_uuid,
      g.code as grade_code, g.text as grade_text, g.basic_salary as grade_basic_salary
    FROM rubric_grade_indice AS rgi
    JOIN grade as g ON g.uuid = rgi.grade_uuid
  `;

  db.convert(options, ['uuid', 'grade_uuid']);

  const filters = new FilterParser(options, {
    tableAlias : 'rgi',
  });

  filters.equals('uuid');
  filters.equals('value');
  filters.equals('rubric_id');
  filters.equals('grade_uuid');
  filters.setOrder('ORDER BY g.text ASC');

  return db.exec(filters.applyQuery(sql), filters.parameters());
}
