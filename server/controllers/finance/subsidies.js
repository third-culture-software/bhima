const db = require('../../lib/db');
const BadRequest = require('../../lib/errors/BadRequest');

function lookupSubsidy(id) {
  const sql = `
    SELECT id, account_id, label, description, value, created_at, updated_at
    FROM subsidy WHERE id = ?;
  `;

  return db.one(sql, id, id, 'subsidy');
}

function detail(req, res, next) {
  lookupSubsidy(req.params.id)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch(next);

}

function list(req, res, next) {
  let sql;

  if (req.query.detailed === '1') {
    sql = `SELECT subsidy.id, subsidy.account_id, subsidy.label, subsidy.description, subsidy.value, subsidy.created_at,
      subsidy.updated_at, account.number
      FROM subsidy
      JOIN account ON account.id = subsidy.account_id`;
  } else {
    sql = 'SELECT id, label, value FROM subsidy';
  }

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

function create(req, res, next) {
  const record = req.body;
  const createSubsidyQuery = 'INSERT INTO subsidy SET ?';

  delete record.id;

  try {
    checkData(record);
  } catch (err) {
    next(err);
    return;
  }

  db.exec(createSubsidyQuery, [record])
    .then((result) => {
      res.status(201).json({ id : result.insertId });
    })
    .catch(next);

}

function update(req, res, next) {
  const queryData = req.body;
  const subsidyId = req.params.id;
  const updateSubsidyQuery = 'UPDATE subsidy SET ? WHERE id = ?';

  delete queryData.id;

  try {
    checkData(queryData);
  } catch (err) {
    next(err);
    return;
  }

  lookupSubsidy(subsidyId)
    .then(() => {
      return db.exec(updateSubsidyQuery, [queryData, subsidyId]);
    })
    .then(() => {
      return lookupSubsidy(subsidyId);
    })
    .then((subsidy) => {
      res.status(200).json(subsidy);
    })
    .catch(next);

}

function remove(req, res, next) {
  const subsidyId = req.params.id;
  const removeSubsidyQuery = 'DELETE FROM subsidy WHERE id = ?';

  lookupSubsidy(subsidyId)
    .then(() => db.exec(removeSubsidyQuery, [subsidyId]))
    .then(() => res.sendStatus(204))
    .catch(next);

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
