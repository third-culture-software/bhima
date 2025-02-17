const stockReport = require('../../functions/stock_report.function');
const ReportManager = require('../../../../lib/ReportManager');

const TEMPLATE = './server/controllers/stock/reports/stock_report.report.handlebars';

exports.report = report;

/**
 * @method report
 *
 * @description
 * This method builds the monthly stock report
 * by month JSON, PDF, or HTML file to be sent to the client.
 *
 * GET /reports/stock/stock_report
 */
async function report(req, res, next) {
  try {
    const output = await stockReport.getData(req.query);
    const { params, data } = output;
    const reporting = new ReportManager(TEMPLATE, req.session, params);
    const result = await reporting.render(data);
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}
