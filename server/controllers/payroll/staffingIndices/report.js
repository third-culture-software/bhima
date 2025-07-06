/**
 * @overview
 * Journal Reports
 *
 * @description
 * This module contains all the code for rendering PDFs of Journal.
 */

const staffing = require('./index');
const shared = require('../../finance/reports/shared');
const ReportManager = require('../../../lib/ReportManager');

const REPORT_TEMPLATE = './server/controllers/payroll/staffingIndices/report.handlebars';

exports.document = staffingIndicesExport;

/**
 * @function staffingIndicesExport
 *
 * @description
 * Makes the staffing indices report.
 */
async function staffingIndicesExport(req, res) {
  const options = {
    ...req.query,
    filename                 : 'TREE.STAFFING_INDICES_MANAGEMENT',
    orientation              : 'landscape',
    csvKey                   : 'rows',
    suppressDefaultFiltering : true,
    suppressDefaultFormating : false,
  };

  const report = new ReportManager(REPORT_TEMPLATE, req.session, options);
  const filters = shared.formatFilters(options);
  const indices = await staffing.lookUp(options);
  const result = await report.render({ filters, indices });
  res.set(result.headers).send(result.report);
}
