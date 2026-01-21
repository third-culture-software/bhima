const db = require('../../lib/db');

module.exports = {
  create,
  read,
  update,
  detail,
  delete : remove,
};

// add a new tag
async function create(req, res) {
  const sql = `INSERT INTO tags SET ?`;
  const data = req.body;
  data.uuid = data.uuid ? db.bid(data.uuid) : db.uuid();
  await db.exec(sql, data);
  res.sendStatus(201);
}

// update tag information
async function update(req, res) {
  const sql = `UPDATE tags SET ?  WHERE uuid =?`;
  const data = req.body;
  delete data.uuid;
  const uuid = db.bid(req.params.uuid);

  await db.exec(sql, [data, uuid]);
  res.sendStatus(200);
}

// get all tags
async function read(req, res) {
  const sql = `
    SELECT BUID(uuid) as uuid, name, color
    FROM tags
    ORDER BY name ASC
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

// get a tag detail
async function detail(req, res) {
  const sql = `
    SELECT BUID(uuid) as uuid, name, color
    FROM tags
    WHERE uuid =?
  `;
  const uuid = db.bid(req.params.uuid);
  const tag = await db.one(sql, uuid);
  res.status(200).json(tag);
}

// get a tag detail
async function remove(req, res) {
  const sql = `
    DELETE FROM tags WHERE uuid =?
  `;
  const uuid = db.bid(req.params.uuid);
  const rows = await db.exec(sql, uuid);
  res.status(204).json(rows);
}
