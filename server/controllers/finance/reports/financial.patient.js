/* eslint-disable prefer-destructuring */
/**
 * @overview server/controllers/finance/reports/financial.patient.js
 *
 * @description
 * This file contains code to create a PDF report for financial activities of a patient
 *
 * @requires Patients
 * @requires ReportManager
 */
const _ = require('lodash');
const ReportManager = require('../../../lib/ReportManager');

const Patients = require('../../medical/patients');
const Debtors = require('../debtors');
const DebtorGroups = require('../debtors/groups');

const TEMPLATE = './server/controllers/finance/reports/financial.patient.handlebars';

const PDF_OPTIONS = {
  filename : 'PATIENT_RECORDS.FINANCIAL_ACTIVITY.REPORT_TITLE',
};

/**
 * @method build
 *
 * @description
 * This method builds the report of financial activities of a patient.
 *
 * GET reports/finance/financePatient/{:uuid}
 */
async function build(req, res) {
  const options = { ...PDF_OPTIONS, ...req.query };

  // set up the report with report manager
  const report = new ReportManager(TEMPLATE, req.session, options);

  const data = {};
  data.includeStockDistributed = parseInt(options.include_stock_distributed, 10);

  function getTxnIndexOfDate(array, date) {
    let i = 0;
    while (i < array.length) {
      if (array[i].created_at > date) { break; }
      i++;
    }
    return i;
  }

  const patient = await Patients.lookupPatient(req.params.uuid);
  Object.assign(data, { patient });

  const dbPromises = [
    Debtors.getFinancialActivity(patient.debtor_uuid, true),
    DebtorGroups.getDebtorGroupHistory(patient.debtor_uuid),
  ];

  if (data.includeStockDistributed) {
    dbPromises.push(Patients.stockMovementByPatient(req.params.uuid));
    dbPromises.push(Patients.stockConsumedPerPatient(req.params.uuid));
  }

  const [{ transactions, aggregates }, history, stockMovement, stockConsumed] = await Promise.all(dbPromises);
  data.totalAllMovement = 0;

  // interleave the debtor group history changes with the transactions
  history.forEach(row => {
    const index = getTxnIndexOfDate(transactions, row.created_at);
    row.isChangeGroup = true;
    transactions.splice(index, 0, row);
  });

  if (data.includeStockDistributed) {
    data.stockMovement = stockMovement;
    data.stockMovement.forEach(item => {
      item.consumed = stockConsumed
        .filter(inv => item.hrReference === inv.reference_text);
      data.totalAllMovement += item.value;
    });
  }

  aggregates.balanceText = aggregates.balance >= 0 ? 'FORM.LABELS.DEBIT_BALANCE' : 'FORM.LABELS.CREDIT_BALANCE';

  _.extend(data, { transactions, aggregates });
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.report = build;
