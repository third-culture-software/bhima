/**
* Units Controller
*
* Lists units for the endpoint /units
*/
const db = require('../lib/db');

const ROOT_NODE = 0;

exports.list = function list(req, res, next) {
  const sql = `
    SELECT
     unit.id, unit.name, unit.key, unit.description, unit.parent
    FROM
     unit
    WHERE unit.id <> ?;
  `;

  db.exec(sql, [ROOT_NODE])
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next);

};
