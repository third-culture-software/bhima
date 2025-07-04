const Accounts = require('../../accounts');
const ReportManager = require('../../../../lib/ReportManager');
const Constants = require('../../../../config/constants');

const TEMPLATE = './server/controllers/finance/reports/accounts/chart.handlebars';

/**
 * @method chart
 *
 * @description
 * Generate chart of account as a document
 */
async function chart(req, res) {

  const params = req.query;
  params.user = req.session.user;
  params.TITLE_ID = Constants.accounts.TITLE;

  const options = {
    ...params,
    csvKey : 'accounts',
    filename : 'REPORT.CHART_OF_ACCOUNTS',
    orientation : 'landscape',
  };

  const report = new ReportManager(TEMPLATE, req.session, options);
  const accounts = Accounts.processAccountDepth(await Accounts.lookupAccount());
  const result = await report.render({ accounts });
  res.set(result.headers).send(result.report);
}

exports.chart = chart;
