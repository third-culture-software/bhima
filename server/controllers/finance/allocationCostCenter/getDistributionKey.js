/**
* Distribution Cost Center Get Distribution Keys.
*
* This function makes it possible to obtain the distribution keys of each auxiliary
* center towards the main centers while reviewing the auxiliary centers which do not yet have distribution keys.
*/
const db = require('../../../lib/db');

async function getDistributionKey(req, res) {
  const sql = `
    SELECT k.auxiliary_cost_center_id, fca.label AS auxiliary_label, k.principal_cost_center_id,
    fcp.label AS principal_label, k.rate, k.user_id, u.display_name AS user_name
    FROM allocation_key as k
    JOIN cost_center AS fca ON fca.id = k.auxiliary_cost_center_id
    JOIN cost_center AS fcp ON fcp.id = k.principal_cost_center_id
    JOIN user AS u ON u.id = k.user_id
    UNION
    SELECT f.id AS auxiliary_cost_center_id, f.label AS auxiliary_label, '---' AS principal_cost_center_id,
    '---' AS principal_label, 0 AS rate, '---' AS user_id, '---' AS user_name
    FROM cost_center AS f
    WHERE f.is_principal = 0 AND f.id NOT IN (SELECT k.auxiliary_cost_center_id FROM allocation_key AS k)
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

function allDistributionKey() {
  const sql = `
    SELECT k.id, k.auxiliary_cost_center_id, k.principal_cost_center_id, k.rate
    FROM allocation_key AS k
  `;

  return db.exec(sql);
}

exports.getDistributionKey = getDistributionKey;
exports.allDistributionKey = allDistributionKey;
