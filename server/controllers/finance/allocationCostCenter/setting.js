/**
* Distribution Cost Center Controller
*
* This function is used to set the various distribution keys of the auxiliary cost centers to the main cost center.
*/

const db = require('../../../lib/db');

async function setting(req, res) {
  const { data } = req.body;

  const dataValues = data.values;

  data.user_id = req.session.user.id;

  const allocationKey = [];

  Object.entries(dataValues)
    .forEach(([principalCenterId, rateDistribution]) => {
      if (rateDistribution) {
        allocationKey.push([
          data.auxiliary_cost_center_id,
          principalCenterId,
          rateDistribution,
          data.user_id,
        ]);
      }
    });

  const delDistribution = `DELETE FROM allocation_key WHERE auxiliary_cost_center_id = ?`;

  const sql = `
    INSERT INTO allocation_key (
    auxiliary_cost_center_id,
    principal_cost_center_id,
    rate,
    user_id) VALUES ?`;

  const transaction = db.transaction();

  if (allocationKey.length) {
    transaction
      .addQuery(delDistribution, data.auxiliary_cost_center_id)
      .addQuery(sql, [allocationKey]);
  }

  const results = await transaction.execute();
  res.status(201).json({ id : results[1].insertId });
}

async function resetKey(req, res) {
  const { data } = req.body;

  const delDistribution = `DELETE FROM allocation_key WHERE auxiliary_cost_center_id = ?`;

  await db.exec(delDistribution, [data]);
  res.sendStatus(204);
}

exports.setting = setting;
exports.resetKey = resetKey;
