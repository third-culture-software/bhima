const db = require('../../lib/db');
const BadRequest = require('../../lib/errors/BadRequest');

function lookupSubsidy(id) {
  const sql = `
    SELECT id, account_id, label, description, value, created_at, updated_at
    FROM subsidy WHERE id = ?;
  `;

  return db.one(sql, id, id, 'subsidy');
}

async function detail(req, res) {
  const row = await lookupSubsidy(req.params.id);
  res.status(200).json(row);
}

async function list(req, res) {
  let sql;

  if (req.query.detailed === '1') {
    sql = `SELECT subsidy.id, subsidy.account_id, subsidy.label, subsidy.description, subsidy.value, subsidy.created_at,
      subsidy.updated_at, account.number
      FROM subsidy
      JOIN account ON account.id = subsidy.account_id`;
  } else {
    sql = 'SELECT id, label, value FROM subsidy';
  }

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

async function create(req, res) {
  const record = req.body;
  const createSubsidyQuery = 'INSERT INTO subsidy SET ?';

  delete record.id;

  checkData(record);

  const result = await db.exec(createSubsidyQuery, [record]);
  res.status(201).json({ id : result.insertId });
}

async function update(req, res) {
  const queryData = req.body;
  const subsidyId = req.params.id;
  const updateSubsidyQuery = 'UPDATE subsidy SET ? WHERE id = ?';

  delete queryData.id;

  checkData(queryData);

  await lookupSubsidy(subsidyId);
  await db.exec(updateSubsidyQuery, [queryData, subsidyId]);
  const subsidy = await lookupSubsidy(subsidyId);
  res.status(200).json(subsidy);
}

async function remove(req, res) {
  const subsidyId = req.params.id;
  const removeSubsidyQuery = 'DELETE FROM subsidy WHERE id = ?';

  await lookupSubsidy(subsidyId);
  await db.exec(removeSubsidyQuery, [subsidyId]);
  res.sendStatus(204);
}

function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}

function checkData(obj) {
  if (isEmptyObject(obj)) {
    throw new BadRequest(`You cannot submit a PUT/POST request with an empty body to the server.`, `ERRORS.EMPTY_BODY`);
  }
  if (!obj.value) {
    throw new BadRequest(`The request requires at least one parameter.`, `ERRORS.PARAMETERS_REQUIRED`);
  }
  if (obj.value <= 0) {
    throw new BadRequest(`You sent a bad value for some parameters`, `ERRORS.BAD_VALUE`);
  }
  if (Number.isNaN(obj.value)) {
    throw new BadRequest(`You sent a bad value for some parameters`, `ERRORS.BAD_VALUE`);
  }
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.detail = detail;
