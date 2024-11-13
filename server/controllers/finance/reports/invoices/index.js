/**
 * @overview
 * Invoice Reports
 *
 * @description
 * This module contains the functionality to generate invoice reports and
 * receipts.
 *
 * @todo - implement the filtering portion of this.  See patient registrations
 * for inspiration.
 */

const _ = require('lodash');

const Moment = require('moment');
const shared = require('../shared');

const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');
const Invoices = require('../../patientInvoice');
const Patients = require('../../../medical/patients');
const Exchange = require('../../exchange');
const Debtors = require('../../debtors');
const Projects = require('../../../admin/projects');

const pdf = require('../../../../lib/renderers/pdf');

const POS_RECEIPT_TEMPLATE = './server/controllers/finance/reports/invoices/receipt.pos.handlebars';
const RECEIPT_TEMPLATE = './server/controllers/finance/reports/invoices/receipt.handlebars';
const REPORT_TEMPLATE = './server/controllers/finance/reports/invoices/report.handlebars';
const CREDIT_NOTE_TEMPLATE = './server/controllers/finance/reports/invoices/creditNote.handlebars';

exports.report = report;
exports.receipt = receipt;
exports.creditNote = creditNote;
exports.reporting = reporting;

/**
 * @function report
 * @desc build a report for invoice patient report of metadata
 * @param {array} data invoice patient report of metadata
 * @return {object} promise
 */
async function report(req, res, next) {
  try {
    const query = _.clone(req.query);

    const result = await reporting(query, req.session);
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);

  }
}

async function reporting(_options, session) {
  const filters = shared.formatFilters(_options);
  _.extend(_options, {
    filename : 'INVOICE_REGISTRY.TITLE',
    csvKey : 'rows',
    orientation : 'landscape',
  });

  const reportInstance = new ReportManager(REPORT_TEMPLATE, session, _options);

  // This is an easy way to make sure that all the data is captured from any
  // given search without having to parse the parameters.  Just map the UUIDs
  // and then we will use only the values previously used.
  const sql = `
    SELECT MIN(invoice.date) AS minDate, MAX(invoice.date) AS maxDate,
      SUM(invoice.cost) AS amount, COUNT(DISTINCT(user_id)) AS numUsers,
      COUNT(invoice.uuid) AS numInvoices,
      COUNT(DISTINCT(project_id)) AS numProjects,
      COUNT(DISTINCT(DATE(invoice.date))) AS numDays,
      COUNT(DISTINCT(invoice.service_uuid)) AS numServices
    FROM invoice
    WHERE invoice.uuid IN (?);
  `;

  const rows = await Invoices.find(_options);
  const uuids = rows.map(row => db.bid(row.uuid));

  // if no uuids, return false as the aggregates
  let aggregates = {};
  if (uuids.length > 0) {
    aggregates = await db.one(sql, [uuids]);
  }

  const hasMultipleProjects = aggregates.numProjects > 1;

  let project = {};
  if (_options.project_id) {
    project = await Projects.findDetails(_options.project_id);
  }

  const result = await reportInstance.render({
    project,
    aggregates,
    hasMultipleProjects,
    rows,
    filters,
  });
  return result;
}

/** receipt */
function receipt(req, res, next) {
  const options = req.query;
  _.extend(options, { filename : 'TREE.PATIENT_INVOICE' });

  const metadata = {
    enterprise : req.session.enterprise,
    project : req.session.project,
    user : req.session.user,
  };

  const invoiceUuid = req.params.uuid;
  const enterpriseId = req.session.enterprise.id;
  const balanceOnInvoiceReceipt = req.session.enterprise.settings.enable_balance_on_invoice_receipt;
  const currencyId = options.currency || req.session.enterprise.currency_id;
  const invoiceResponse = {};
  invoiceResponse.lang = options.lang;

  let template = RECEIPT_TEMPLATE;

  if (Boolean(Number(options.posReceipt))) {
    template = POS_RECEIPT_TEMPLATE;
    _.extend(options, pdf.posReceiptOptions);
  }

  let receiptReport;

  try {
    receiptReport = new ReportManager(template, req.session, options);
  } catch (e) {
    next(e);
    return;
  }

  Invoices.lookupInvoice(invoiceUuid)
    .then(reportResult => {

      const recipientUuid = reportResult.patient_uuid;
      _.extend(invoiceResponse, reportResult);

      return Promise.all([
        Patients.lookupPatient(recipientUuid),
        Invoices.lookupInvoiceCreditNote(invoiceUuid),
        Exchange.getExchangeRate(enterpriseId, currencyId, new Date()),
      ]);
    })
    .then(([recipient, cNote, exchangeResult]) => {
      _.extend(invoiceResponse, { recipient, creditNote : cNote }, metadata);

      invoiceResponse.recipient.hasConventionCoverage = invoiceResponse.recipient.is_convention;

      if (invoiceResponse.creditNote) {
        invoiceResponse.isCreditNoted = true;
        invoiceResponse.creditNoteReference = invoiceResponse.creditNote.reference;
      }

      invoiceResponse.balanceOnInvoiceReceipt = balanceOnInvoiceReceipt;
      invoiceResponse.receiptCurrency = currencyId;
      invoiceResponse.exchange = exchangeResult.rate;
      invoiceResponse.dateFormat = (new Moment()).format('L');
      if (invoiceResponse.exchange) {
        invoiceResponse.exchangedTotal = _.round(invoiceResponse.cost * invoiceResponse.exchange);
      }

      return balanceOnInvoiceReceipt ? Debtors.invoiceBalances(invoiceResponse.debtor_uuid, [invoiceUuid]) : [];
    })
    .then(invoiceBalance => {

      if (invoiceBalance.length > 0) {
        [invoiceResponse.invoiceBalance] = invoiceBalance;

        if (invoiceResponse.exchange) {
          invoiceResponse.invoiceBalance.exchangedDebit = _.round(
            invoiceResponse.invoiceBalance.debit * invoiceResponse.exchange,
          );

          invoiceResponse.invoiceBalance.exchangedCredit = _.round(
            invoiceResponse.invoiceBalance.credit * invoiceResponse.exchange,
          );

          invoiceResponse.invoiceBalance.exchangedBalance = _.round(
            invoiceResponse.invoiceBalance.balance * invoiceResponse.exchange,
          );
        }
      }

      return receiptReport.render(invoiceResponse);
    })
    .then(result => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

}

/** credit note */
function creditNote(req, res, next) {
  const options = req.query;
  _.extend(options, { filename : 'TREE.CREDIT_NOTE' });

  const metadata = {
    enterprise : req.session.enterprise,
    project : req.session.project,
    user : req.session.user,
  };

  const invoiceUuid = req.params.uuid;
  const enterpriseId = req.session.enterprise.id;
  const currencyId = options.currency || req.session.enterprise.currency_id;
  const invoiceResponse = {};
  invoiceResponse.lang = options.lang;

  const template = CREDIT_NOTE_TEMPLATE;

  let creditNoteReport;

  try {
    creditNoteReport = new ReportManager(template, req.session, options);
  } catch (e) {
    next(e);
    return;
  }

  Invoices.lookupInvoice(invoiceUuid)
    .then(reportResult => {
      const recipientUuid = reportResult.patient_uuid;
      _.extend(invoiceResponse, reportResult);

      return Promise.all([
        Patients.lookupPatient(recipientUuid),
        Invoices.lookupInvoiceCreditNote(invoiceUuid),
      ]);
    })
    .then(([recipient, cNote]) => {
      _.extend(invoiceResponse, { recipient, creditNote : cNote }, metadata);
      return Exchange.getExchangeRate(enterpriseId, currencyId, new Date());
    })
    .then(exchangeResult => {
      invoiceResponse.receiptCurrency = currencyId;
      invoiceResponse.lang = options.lang;
      invoiceResponse.exchange = exchangeResult.rate;
      invoiceResponse.dateFormat = (new Moment()).format('L');
      if (invoiceResponse.exchange) {
        invoiceResponse.exchangedTotal = _.round(invoiceResponse.cost * invoiceResponse.exchange);
      }
    })
    .then(() => creditNoteReport.render(invoiceResponse))
    .then(result => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

}
