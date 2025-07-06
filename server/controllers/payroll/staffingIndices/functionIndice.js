const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.delete = remove;
exports.lookUp = lookUp;

// retrieve all staffing indexes
async function list(req, res) {
  const staffingFunctionIndices = await lookUp(req.query);
  res.status(200).json(staffingFunctionIndices);
}

async function detail(req, res) {
  const sql = `
    SELECT HEX(uuid) as uuid, value, fonction_id
    FROM staffing_function_indice
    WHERE uuid = ?`;

  const staffingFunctionIndice = await db.one(sql, db.bid(req.params.uuid));
  res.status(200).json(staffingFunctionIndice);
}

// create a new staffing_function_indice
async function create(req, res) {
  const sql = `INSERT INTO staffing_function_indice  SET ?`;
  const staffingFunctionIndice = req.body;
  staffingFunctionIndice.uuid = req.body.uuid ? db.bid(staffingFunctionIndice.uuid) : db.uuid();
  await db.exec(sql, staffingFunctionIndice);
  res.sendStatus(201);
}

// update a staffing_function_indice
async function update(req, res) {
  db.convert(req.body, ['uuid']);

  const staffingFunctionIndice = req.body;
  delete staffingFunctionIndice.uuid;

  const sql = `UPDATE staffing_function_indice  SET ? WHERE uuid = ?`;

  const staffingFunctionIndices = await db.exec(sql, [staffingFunctionIndice, db.bid(req.params.uuid)]);
  res.status(200).json(staffingFunctionIndices);
}

// delete a staffing_function_indice
async function remove(req, res) {
  const sql = `DELETE FROM staffing_function_indice WHERE uuid = ?`;
  await db.exec(sql, db.bid(req.params.uuid));
  res.sendStatus(200);
}

function lookUp(options = {}) {
  const sql = `
    SELECT HEX(s.uuid) as uuid, s.value, s.fonction_id, f.fonction_txt
    FROM staffing_function_indice AS s
      JOIN fonction f on f.id = s.fonction_id
  `;

  db.convert(options, ['uuid']);

  const filters = new FilterParser(options, {
    tableAlias : 's',
  });

  filters.equals('uuid');
  filters.equals('value');
  filters.equals('fonction_id');
  filters.setOrder('ORDER BY f.fonction_txt ASC');

  return db.exec(filters.applyQuery(sql), filters.parameters());
}
