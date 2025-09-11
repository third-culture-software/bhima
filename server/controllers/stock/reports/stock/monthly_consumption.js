const _ = require('lodash');
const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');

const TEMPLATE = './server/controllers/stock/reports/monthly_consumption.report.handlebars';

exports.report = report;

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'monthlyConsumption',
  filename : 'REPORT.MONTHLY_CONSUMPTION.TITLE',
  orientation : 'portrait',
};

/**
 * @method report
 *
 * @description
 * This method builds the consumption report by month JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/monthly_consumption
 */
async function report(req, res) {
  const data = {};

  data.params = { ...req.query };
  const params = { ...DEFAULT_PARAMS, ...req.query };

  if (!params.depotUuid) {
    throw new Error(req.__('ERROR.REPORT.DEPOT_REQUIRED'));
  }
  if (!params.periodFrom) {
    throw new Error(req.__('ERROR.REPORT.PERIOD_FROM_REQUIRED'));
  }
  if (!params.periodTo) {
    throw new Error(req.__('ERROR.REPORT.PERIOD_TO_REQUIRED'));
  }
  if (!params.fiscal) {
    throw new Error(req.__('ERROR.REPORT.FISCAL_YEAR_REQUIRED'));
  }

  const reporting = new ReportManager(TEMPLATE, req.session, params);

  const [start, end, fiscal, range] = await Promise.all([
    db.one('SELECT id, start_date, end_date FROM period WHERE id = ?;', params.periodFrom),
    db.one('SELECT id, start_date, end_date FROM period WHERE id = ?;', params.periodTo),
    db.one('SELECT id, label from fiscal_year WHERE id = ?;', params.fiscal),
    db.exec(`
        SELECT id, start_date, end_date, translate_key, MONTH(start_date) AS month
        FROM period WHERE id >= ? and id <= ?
        ORDER BY id;
      `, [params.periodFrom, params.periodTo]),
  ]);

  // details SQL
  const sql = `
      SELECT BUID(sms.inventory_uuid) as inventory_uuid,
        i.code, i.text,
        SUM(sms.out_quantity_consumption) AS quantity,
        MONTH(sms.date) AS month
      FROM stock_movement_status sms JOIN inventory i ON sms.inventory_uuid = i.uuid
      WHERE sms.depot_uuid = ? AND sms.date >= ? AND sms.date <= ?
      GROUP BY sms.inventory_uuid, MONTH(sms.date)
      ORDER BY sms.date;
    `;

  // aggregate SQL
  const aggregateSQL = `
      SELECT BUID(sms.inventory_uuid) as inventory_uuid,
        i.code, i.text,
        SUM(sms.out_quantity_consumption) AS quantity
      FROM stock_movement_status sms JOIN inventory i ON sms.inventory_uuid = i.uuid
      WHERE sms.depot_uuid = ? AND sms.date >= ? AND sms.date <= ?
      GROUP BY sms.inventory_uuid;
    `;

  const [rows, totals] = await Promise.all([
    db.exec(sql, [db.bid(params.depotUuid), start.start_date, end.end_date]),
    db.exec(aggregateSQL, [db.bid(params.depotUuid), start.start_date, end.end_date]),
  ]);

  // offset all values by the first month (0-indexed)
  const offset = range[0].month - 1;

  // order totals by inventory label (alphabetically)
  totals.sort((a, b) => a.text.localeCompare(b.text));

  const matrix = totals.map((inventory, idx) => {

    // now we have each total for this in "columns"
    const filtered = rows
      .filter(row => row.inventory_uuid === inventory.inventory_uuid);

    // map the row onto the correct index (max 12);
    const months = new Array(12).fill(0);

    // remember, mysql is 1-indexed, JS is 0-indexed
    // we need to offset by one.
    filtered.forEach(row => {
      months[row.month - 1] = row.quantity;
    });

    const index = idx + 1;
    const label = `${inventory.code} - ${inventory.text}`;
    const periods = months.slice(offset);
    const total = inventory.quantity;

    // drop the last periods not needed.
    periods.length = range.length;

    return [index, label, ...periods, total];
  });

  // array of arrays containing the matrix of data
  data.matrix = matrix;

  // create the header row to be templated in and translated
  data.header = range.map(n => n.translate_key);

  // compute the column span in case there is no data
  data.size = data.header.length + 3;

  data.fiscalYear = fiscal.label;
  data.depot = params.depot_text;

  const result = await reporting.render(data);
  res.set(result.headers).send(result.report);
}
