const db = require('../../lib/db');

async function healthZones(req, res) {
  const sql = 'SELECT id, zone, territoire, province FROM mod_snis_zs';

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

// Expose
module.exports = {
  healthZones,
};
