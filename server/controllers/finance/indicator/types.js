const db = require('../../../lib/db');

exports.list = list;

async function list(req, res) {
  const sql = `SELECT id, text, translate_key FROM indicator_type`;
  const rows = await db.exec(sql);
  res.status(200).json(rows);
}
