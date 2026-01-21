const db = require('../../lib/db');

module.exports = {
  create,
  read,
  update,
  detail,
  delete : remove,
};

// add a new funding source
async function create(req, res) {
  const sql = `INSERT INTO funding_source SET ?`;
  const data = req.body;
  const indentifier = data.uuid;
  data.uuid = data.uuid ? db.bid(data.uuid) : db.uuid();
  await db.exec(sql, data);
  res.status(201).json({ uuid : indentifier });
}

// update funding source information
async function update(req, res) {
  const sql = `UPDATE funding_source SET ?  WHERE uuid =?`;
  const data = req.body;
  delete data.uuid;
  const uuid = db.bid(req.params.uuid);

  await db.exec(sql, [data, uuid]);
  const value = await getDetails(uuid);
  res.status(200).json(value);
}

// get all funding sources
async function read(req, res) {
  const sql = `
    SELECT BUID(uuid) as uuid, label, code
    FROM funding_source
    ORDER BY label ASC
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
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
async function detail(req, res) {
  const uuid = db.bid(req.params.uuid);
  const value = await getDetails(uuid);
  res.status(200).json(value);
}

// get a funding source detail
async function remove(req, res) {
  const sql = `
    DELETE FROM funding_source WHERE uuid =?
  `;
  const uuid = db.bid(req.params.uuid);
  const rows = await db.exec(sql, uuid);
  res.status(204).json(rows);
}
