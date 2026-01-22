const {
  _, db, ReportManager, STOCK_AGGREGATED_CONSUMPTION_REPORT_TEMPLATE,
} = require('../common');

/**
 * @method stockAggregatedConsumptionReport
 *
 * @description
 * This method builds the aggregated stock consumption report as either a
 * JSON, PDF, or HTML file to be sent to the client.
 *
 * GET /reports/stock/aggregated_consumption
 */
async function stockAggregatedConsumptionReport(req, res) {
  const result = await reporting(req.query, req.session);
  res.set(result.headers).send(result.report);
}

async function reporting(_options, session) {
  const data = {};

  const optionReport = _.extend(_options, {
    filename : 'REPORT.AGGREGATED_STOCK_CONSUMPTION.TITLE',
  });

  const TO_PATIENT = 9;
  const TO_SERVICE = 10;

  const report = new ReportManager(STOCK_AGGREGATED_CONSUMPTION_REPORT_TEMPLATE, session, optionReport);

  const options = (typeof (_options.params) === 'string') ? JSON.parse(_options.params) : _options.params;
  data.dateFrom = options.dateFrom;
  data.dateTo = options.dateTo;

  // Handle the depot uuid option
  data.depotUuid = options.depotUuid;
  data.depotName = null;
  if (data.depotUuid) {
    const depotQuery = `SELECT text FROM depot WHERE uuid = ?`;
    const result = await db.one(depotQuery, db.bid(data.depotUuid));
    data.depotName = result.text;
  }

  // Handle the inventory group uuid option
  data.inventoryGroupUuid = options.inventoryGroupUuid;
  data.inventoryGroupName = null;
  if (data.inventoryGroupUuid) {
    const gnameQuery = `SELECT name FROM inventory_group WHERE uuid = ?`;
    const result = await db.one(gnameQuery, db.bid(data.inventoryGroupUuid));
    data.inventoryGroupName = result.name;
  }
  const WhereInvGroup = options.inventoryGroupUuid
    ? `AND inv.group_uuid = HUID(${db.escape(options.inventoryGroupUuid)})` : '';

  // Get the depot UUIDs
  const depotUuids = options.depotUuid ? [db.bid(options.depotUuid)] : [];
  if (!options.depotUuid) {
    // Get the list of unique depots for this report (sorted by name)
    const sqlDepots = `
      SELECT dep.uuid, dep.text as depot_name
      FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
      JOIN depot as dep ON dep.uuid = sm.depot_uuid
      WHERE DATE(sm.date) BETWEEN DATE(?) AND DATE(?) AND
            sm.flux_id IN (${TO_SERVICE}, ${TO_PATIENT}) AND
            sm.is_exit=1 ${WhereInvGroup}
      GROUP BY dep.uuid
      ORDER BY depot_name ASC;
    `;
    const allDepots = await db.exec(sqlDepots, [data.dateFrom, data.dateTo]);
    depotUuids.push(...allDepots.map(dep => dep.uuid));
  }

  const accumulatedResults = [];

  // Loop through the depots and accumulate the results
  await depotUuids.reduce(async (memo, depotUuid) => {
    await memo;

    // Get the aggregated stock consumption for both service and patients
    const sqlCombined = `
      SELECT
        mov.depot_uuid, mov.depot_name, mov.code, mov.inventory_name,
        MIN(mov.quantity) AS min_quantity,
        MAX(mov.quantity) AS max_quantity,
        SUM(mov.quantity) AS quantity,
        COUNT(DISTINCT(mov.sm_uuid)) AS num_distributions
      FROM (
        SELECT inv.uuid AS inventory_uuid, inv.text as inventory_name, inv.code,
              sm.uuid as sm_uuid, sm.quantity, sm.entity_uuid, sm.date,
              dep.uuid as depot_uuid, dep.text as depot_name
        FROM stock_movement AS sm
        JOIN lot AS l ON l.uuid = sm.lot_uuid
        JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
        JOIN depot as dep ON dep.uuid = sm.depot_uuid
        WHERE DATE(sm.date) BETWEEN DATE(?) AND DATE(?) AND
              sm.flux_id IN (${TO_SERVICE}, ${TO_PATIENT}) AND
              sm.is_exit=1 AND dep.uuid = ? ${WhereInvGroup}
      ) AS mov
      GROUP BY mov.depot_uuid, mov.inventory_uuid
      ORDER BY mov.depot_name, mov.inventory_name ASC;
    `;

    // Get the aggregated stock distributions to either patients or services
    const aggregatedValues = await db.exec(sqlCombined, [data.dateFrom, data.dateTo, depotUuid]);

    // Get the aggregated stock consumption for patients
    const sqlPatients = `
      SELECT
        mov.depot_uuid, mov.depot_name, mov.code, mov.inventory_name,
        MIN(mov.quantity) AS min_quantity_patients,
        MAX(mov.quantity) AS max_quantity_patients,
        SUM(mov.quantity) AS quantity_patients,
        COUNT(DISTINCT(mov.sm_uuid)) AS num_distributions_patients,
        COUNT(DISTINCT(mov.entity_uuid)) AS num_patients
      FROM (
        SELECT inv.uuid AS inventory_uuid, inv.text as inventory_name, inv.code,
              sm.uuid as sm_uuid, sm.quantity, sm.entity_uuid, sm.date,
              dep.uuid as depot_uuid, dep.text as depot_name
        FROM stock_movement AS sm
        JOIN lot AS l ON l.uuid = sm.lot_uuid
        JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
        JOIN depot as dep ON dep.uuid = sm.depot_uuid
        WHERE DATE(sm.date) BETWEEN DATE(?) AND DATE(?) AND
              sm.flux_id=${TO_PATIENT} AND
              sm.is_exit=1 AND dep.uuid = ? ${WhereInvGroup}
      ) AS mov
      GROUP BY mov.depot_uuid, mov.inventory_uuid;
  `;

    // Get the aggregated stock distributions to patients
    const patientValues = await db.exec(sqlPatients, [options.dateFrom, options.dateTo, depotUuid]);

    // Add in the patient data to the row for each distribution to patients
    await aggregatedValues.forEach(dist => {
      const patData = patientValues.find(row => row.code === dist.code);
      if (patData) {
        dist.avg_distribution = (dist.quantity / dist.num_distributions).toFixed(1);
        dist.min_quantity_patients = patData.min_quantity_patients;
        dist.max_quantity_patients = patData.max_quantity_patients;
        dist.quantity_patients = patData.quantity_patients;
        dist.num_patients = patData.num_patients;
        dist.num_distributions_patients = patData.num_distributions_patients;
        dist.avg_distribution_per_patient = (patData.quantity_patients / patData.num_patients).toFixed(1);
      }
    });

    accumulatedResults.push(...aggregatedValues);
  }, undefined);

  // group by depot
  const groupedDepots = _.groupBy(accumulatedResults, d => d.depot_name);
  const depots = {};

  Object.keys(groupedDepots).sort(compare).forEach(d => {
    depots[d] = _.sortBy(groupedDepots[d], line => String(line.depot_name).toLocaleLowerCase());
  });

  data.depots = depots || [];
  data.accumulatedResults = accumulatedResults || [];

  data.emptyResult = data.accumulatedResults.length === 0;

  return report.render(data);
}

function compare(a, b) {
  return a.localeCompare(b);
}

module.exports = stockAggregatedConsumptionReport;
