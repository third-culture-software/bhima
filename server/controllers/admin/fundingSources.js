const db = require('../../lib/db');

module.exports = {
  create,
  read,
  update,
  detail,
  delete : remove,
};

// add a new funding source
function create(req, res, next) {
  const sql = `INSERT INTO funding_source SET ?`;
  const data = req.body;
  data.uuid = data.uuid ? db.bid(data.uuid) : db.uuid();
  db.exec(sql, data)
    .then(() => {
      res.status(201).json({ uuid : data.uuid });
    }).catch(next);
}

// update funding source information
function update(req, res, next) {
  const sql = `UPDATE funding_source SET ?  WHERE uuid =?`;
  const data = req.body;
  delete data.uuid;
  const uuid = db.bid(req.params.uuid);

  db.exec(sql, [data, uuid])
    .then(() => {
      const value = getDetails(uuid);
      res.status(200).json(value);
    }).catch(next);
}

// get all funding sources
function read(req, res, next) {
  const sql = `
    SELECT BUID(uuid) as uuid, label, code
    FROM funding_source
    ORDER BY label ASC
  `;

  db.exec(sql)
    .then(rows => {
      res.status(200).json(rows);
    }).catch(next);
}

function getDetails(uuid) {
  const sql = `
    SELECT BUID(uuid) as uuid, label, code
    FROM funding_source
    WHERE uuid =?
  `;
  return db.one(sql, uuid);
}

// get a funding source detail
function detail(req, res, next) {
  const uuid = db.bid(req.params.uuid);
  getDetails(uuid)
    .then(value => {
      res.status(200).json(value);
    }).catch(next);
}

// get a funding source detail
function remove(req, res, next) {
  const sql = `
    DELETE FROM funding_source WHERE uuid =?
  `;
  const uuid = db.bid(req.params.uuid);
  db.exec(sql, uuid)
    .then(rows => {
      res.status(204).json(rows);
    }).catch(next);
}
