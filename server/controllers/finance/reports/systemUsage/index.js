const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');

const TEMPLATE = './server/controllers/finance/reports/systemUsage/system.usage.handlebars';

const DEFAULT_PARAMS = {
  csvKey : 'rows',
  filename : 'REPORT.SYSTEM_USAGE_STAT.TITLE',
  orientation : 'landscape',
};
// expose to the API
exports.document = document;

async function document(req, res) {
  const options = { ...DEFAULT_PARAMS, ...req.query };
  const report = new ReportManager(TEMPLATE, req.session, options);
  const { date } = req.query;

  const patientsNbr = `
      SELECT HOUR(created_at) as 'hour', COUNT(patient.uuid) as 'number',
        GROUP_CONCAT(DISTINCT user_id ORDER BY user_id) AS users
      FROM patient
      WHERE DATE(created_at) = DATE(?)
      GROUP BY HOUR(created_at)
    `;

  const invoicesNbr = `
      SELECT HOUR(created_at) as 'hour', COUNT(invoice.uuid) as 'number',
        GROUP_CONCAT(DISTINCT user_id ORDER BY user_id) AS users
      FROM invoice
      WHERE DATE(created_at) = DATE(?)
      GROUP BY HOUR(created_at)
    `;

  const cashNbr = `
      SELECT HOUR(created_at) as 'hour', COUNT(cash.uuid) as 'number',
        GROUP_CONCAT(DISTINCT user_id ORDER BY user_id) AS users
      FROM cash
      WHERE DATE(created_at) = DATE(?)
      GROUP BY HOUR(created_at)
    `;

  const stockMovementNbr = `
      SELECT HOUR(created_at) as 'hour', COUNT(DISTINCT document_uuid) as 'number',
        GROUP_CONCAT(DISTINCT user_id ORDER BY user_id) AS users
      FROM stock_movement
      WHERE DATE(created_at) = DATE(?)
      GROUP BY HOUR(created_at)
    `;

  const [
    patients,
    invoices,
    cashPayments,
    stockMovements,
  ] = await Promise.all([
    db.exec(patientsNbr, date),
    db.exec(invoicesNbr, date),
    db.exec(cashNbr, date),
    db.exec(stockMovementNbr, date),
  ]);

  // group by hour
  const hour = v => v.hour;
  const patientMap = Object.groupBy(patients, hour);
  const cashPaymentMap = Object.groupBy(cashPayments, hour);
  const invoicesMap = Object.groupBy(invoices, hour);
  const stockMovementsMap = Object.groupBy(stockMovements, hour);

  const pivot = [];

  for (let i = 0; i < 25; i++) {
    const index = `${i}`;
    const row = {
      hour : index, patients : 0, invoices : 0, cashPayments : 0, stockMovements : 0, users : 0,
    };

    let aggregateUsers = '';

    if (patientMap[index]) {
      const { number, users } = patientMap[index][0];
      row.patients = number;
      aggregateUsers += users;
    }

    if (invoicesMap[index]) {
      const { number, users } = invoicesMap[index][0];
      row.invoices = number;
      aggregateUsers += users;
    }

    if (cashPaymentMap[index]) {
      const { number, users } = cashPaymentMap[index][0];
      row.cashPayments = number;
      aggregateUsers += users;
    }

    if (stockMovementsMap[index]) {
      const { number, users } = stockMovementsMap[index][0];
      row.stockMovements = number;
      aggregateUsers += users;
    }

    // make a unique array of users and count them
    const users = aggregateUsers
      .split(',')
      .sort()
      .filter((value, idx, arr) => arr.indexOf(value) === idx)
      .length;

    row.users = users;

    pivot.push(row);
  }

  const cleaned = pivot.filter(row => (row.patients + row.invoices + row.cashPayments + row.stockMovements > 0));

  // aggregate all relevant
  const aggregates = cleaned.reduce((agg, row) => {
    agg.patients += row.patients;
    agg.invoices += row.invoices;
    agg.cashPayments += row.cashPayments;
    agg.stockMovements += row.stockMovements;
    return agg;
  }, {
    patients : 0, invoices : 0, cashPayments : 0, stockMovements : 0, users : 0,
  });

  const result = await report.render({
    statDate : date,
    pivot : cleaned,
    aggregates,
  });

  res.set(result.headers).send(result.report);
}
