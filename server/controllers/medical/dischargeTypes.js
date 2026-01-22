const db = require('../../lib/db');

exports.list = list;

async function list(req, res) {
  const query = `
    SELECT id, label FROM discharge_type ORDER BY id;
  `;
  const rows = await db.exec(query);
  res.status(200).json(rows);
}
