const db = require('../../lib/db');

exports.list = list;

function list(req, res, next) {
  const query = `
    SELECT id, label FROM discharge_type ORDER BY id;
  `;
  db.exec(query)
    .then(rows => res.status(200).json(rows))
    .catch(next);

}
