const {
  _, ReportManager,
  STOCK_AVG_MED_COSTS_PER_PATIENT_TEMPLATE,
  db,
} = require('../common');

const Exchange = require('../../../finance/exchange');

/**
 * @method stockAvgMedCostsPerPatientReport
 *
 * @description
 * Construct the report for average medication costs per patient
 *
 * GET /reports/stock/avg_med_costs_per_patient'
 */
async function stockAvgMedCostsPerPatientReport(req, res, next) {
  const { enterprise } = req.session;

  const options = req.query;
  const {
    dateFrom, dateTo,
    depotUuid, depotName,
    serviceUuid, serviceName,
  } = options;

  const reportOptions = _.extend({}, options, {
    filename : 'TREE.AVERAGE_MED_COST_REPORT',
    title : 'REPORT.AVG_MED_COST_PER_PATIENT.TITLE',
  });

  let report;

  const data = {};

  const currencyId = Number(options.currencyId);
  const exchangeRate = await Exchange.getExchangeRate(enterprise.id, currencyId, new Date());
  const rate = exchangeRate.rate || 1;

  try {
    report = new ReportManager(STOCK_AVG_MED_COSTS_PER_PATIENT_TEMPLATE, req.session, reportOptions);
  } catch (e) {
    return next(e);
  }
  const depotSql = depotUuid ? `AND sm.depot_uuid = ?` : '';
  const serviceSql = serviceUuid ? `AND inv.service_uuid = ?` : '';

  const sql = `
      SELECT
        smtot.depot_uuid,  dep.text AS depot_name,
        smtot.service_uuid, srv.name AS service_name,
        smtot.srvTotal, smtot.srvPatCount,
        (smtot.srvTotal / smtot.srvPatCount) AS srvAvgCost,
        smtot.totalMedCosts, smtot.totalNumPatients,
        (smtot.totalMedCosts / smtot.totalNumPatients) AS avgMedCosts
      FROM (
        SELECT
          sm.entity_uuid AS patient_uuid,
          sm.depot_uuid,
          inv.service_uuid,
          sm.unit_cost,
          sm.quantity,

          SUM(sm.quantity * sm.unit_cost) OVER (PARTITION BY sm.depot_uuid, inv.service_uuid) AS srvTotal,

          -- Computes: COUNT(DISTINCT sm.entity_uuid) OVER (PARTITION BY sm.depot_uuid, inv.service_uuid)
          (DENSE_RANK() OVER (PARTITION BY sm.depot_uuid,
              inv.service_uuid ORDER BY sm.entity_uuid ASC) +
           DENSE_RANK() OVER (PARTITION BY sm.depot_uuid,
              inv.service_uuid ORDER BY sm.entity_uuid DESC) - 1) AS srvPatCount,

          SUM(sm.quantity * sm.unit_cost) OVER () AS totalMedCosts,

          -- Computes: COUNT(DISTINCT sm.entity_uuid) OVER (PARTITION BY sm.entity_uuid)
          (DENSE_RANK() OVER (ORDER BY sm.entity_uuid ASC) +
           DENSE_RANK() OVER (ORDER BY sm.entity_uuid DESC) - 1) AS totalNumPatients

        FROM stock_movement AS sm
        JOIN patient AS pat ON pat.uuid = sm.entity_uuid
        LEFT JOIN invoice AS inv ON inv.uuid = sm.invoice_uuid
        WHERE
          sm.flux_id = 9 AND sm.is_exit = 1
          AND DATE(sm.date) BETWEEN DATE(?) AND DATE(?)
          ${depotSql}
          ${serviceSql}
        ) AS smtot
      JOIN depot AS dep ON dep.uuid = smtot.depot_uuid
      LEFT JOIN service AS srv ON srv.uuid = smtot.service_uuid
      GROUP BY smtot.depot_uuid, smtot.service_uuid
      ORDER BY dep.text, srv.name
    `;

  const params = [dateFrom, dateTo];
  if (depotUuid) {
    params.push(db.bid(depotUuid));
  }
  if (serviceUuid) {
    params.push(db.bid(serviceUuid));
  }

  return db.exec(sql, params)
    .then((results) => {
      data.currencyId = currencyId;
      data.exchangeRate = rate;
      data.dateFrom = dateFrom;
      data.dateTo = dateTo;
      data.depotName = depotName;
      data.serviceName = serviceName;
      data.depotOrService = depotUuid || serviceUuid;
      data.depotAndService = depotUuid && serviceUuid;

      results.forEach(row => {
        if (row.service_name === null) {
          row.service_name = 'INVENTORY.NONE';
        }
        row.srvTotal *= rate;
        row.srvAvgCost *= rate;
      });

      if (results.length > 0) {
        data.totalMedCosts = results[0].totalMedCosts * rate;
        data.totalNumPatients = results[0].totalNumPatients;
        data.avgMedCosts = results[0].avgMedCosts * rate;
      }

      data.rows = results;
      return report.render(data);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    
}

module.exports = stockAvgMedCostsPerPatientReport;
