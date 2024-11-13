const db = require('./../../lib/db');

function healthZones(req, res, next) {
  const sql = 'SELECT id, zone, territoire, province FROM mod_snis_zs';

  db.exec(sql)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

// Expose
module.exports = {
  healthZones,
};
