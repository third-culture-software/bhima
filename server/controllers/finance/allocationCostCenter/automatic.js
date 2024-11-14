/**
* Distribution Cost Center Automatic Controller
*
* This function allows automatic distribution of invoices whose services are linked to Principal cost centers
*/
const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');

async function automatic(req, res, next) {
  const { data } = req.body;

  const transUuids = data.map(item => db.bid(item.uuid));

  const sql = `
    SELECT BUID(gl.uuid) AS row_uuid, gl.trans_id, gl.debit_equiv, gl.credit_equiv, gl.account_id,
      gl.record_uuid, sfc.cost_center_id, iv.description, iv.service_uuid, s.name AS serviceName
    FROM general_ledger AS gl
    JOIN invoice AS iv ON iv.uuid = gl.record_uuid
    JOIN service AS s ON s.uuid = iv.service_uuid
    JOIN service_cost_center AS sfc ON sfc.service_uuid = s.uuid
    WHERE gl.uuid IN (?)
  `;

  try {
    const rows = await db.exec(sql, [transUuids]);

    const dataToDistribute = [];
    const userId = req.session.user.id;

    rows.forEach((row) => {
      data.forEach((item) => {
        item.is_cost = item.is_cost || 0;

        if (row.row_uuid === item.uuid) {
          dataToDistribute.push([
            db.bid(row.row_uuid),
            row.trans_id,
            item.account_id,
            item.is_cost,
            item.is_variable,
            item.is_turnover,
            item.cost_center_id,
            row.cost_center_id,
            row.debit_equiv,
            row.credit_equiv,
            new Date(),
            userId,
          ]);
        }
      });
    });

    if (!dataToDistribute.length) {
      throw new NotFound(`Could not find any service linked to cost centers`);
    }

    const sqlCostCenterDistribution = `INSERT INTO cost_center_allocation (
      row_uuid,
      trans_id,
      account_id,
      is_cost,
      is_variable,
      is_turnover,
      auxiliary_cost_center_id,
      principal_cost_center_id,
      debit_equiv,
      credit_equiv,
      date_distribution, user_id) VALUES ?`;

    const results = await db.exec(sqlCostCenterDistribution, [dataToDistribute]);
    res.status(201).json({ id : results.insertId });
  } catch (err) {
    next(err);
  }
}

exports.automatic = automatic;
