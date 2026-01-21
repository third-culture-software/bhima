/**
 * @overview
 * Invoice Reports
 *
 * @description
 * This module contains the functionality to generate invoice reports and
 * receipts.
 */

const _ = require('lodash');

const ReportManager = require('../../../../lib/ReportManager');
const Purchases = require('../../purchases');
const shared = require('../shared');

const REPORT_TEMPLATE = './server/controllers/finance/reports/purchases/report.handlebars';
const REPORT_TEMPLATE_DETAILED = './server/controllers/finance/reports/purchases/report_detailed.handlebars';

exports.report = report;
exports.reportDetailed = reportDetailed;

/**
 * @function report
 *
 * @description
 * Build a report for Purchase Registry report of metadata
 *
 */
async function report(req, res) {
  const query = { ...req.query };
  const filters = shared.formatFilters(req.query);

  _.extend(query, {
    filename : 'TREE.PURCHASE_REGISTRY',
    csvKey : 'rows',
    orientation : 'landscape',
  });

  const reportInstance = new ReportManager(REPORT_TEMPLATE, req.session, query);
  const rows = await Purchases.find(query);
  const result = await reportInstance.render({ filters, rows });
  res.set(result.headers).send(result.report);
}

/**
 * @function reportDetailed
 *
 * @description
 * Build a report detailed for Purchase Registry report of metadata
 *
 */
async function reportDetailed(req, res) {
  const query = { ...req.query };
  const filters = shared.formatFilters(req.query);

  _.extend(query, {
    filename : 'TREE.PURCHASE_REGISTRY_DETAILED',
    csvKey : 'rows',
    orientation : 'landscape',
  });

  const reportInstance = new ReportManager(REPORT_TEMPLATE_DETAILED, req.session, query);
  const rows = await Purchases.findDetailed(query);
  const result = await reportInstance.render({ filters, rows });
  res.set(result.headers).send(result.report);
}
