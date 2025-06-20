/**
* Units Controller
*
* Lists units for the endpoint /units
*/
const db = require('../lib/db');

const ROOT_NODE = 0;

exports.list = async function list(req, res) {
  const sql = `
    SELECT
     unit.id, unit.name, unit.key, unit.description, unit.parent
    FROM
     unit
    WHERE unit.id <> ?;
  `;

  const rows = await db.exec(sql, [ROOT_NODE]);
  res.status(200).json(rows);
};
