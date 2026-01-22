const rumer = require('../../functions/rumer.function');
const ReportManager = require('../../../../lib/ReportManager');

const TEMPLATE1 = './server/controllers/stock/reports/rumer.report.handlebars';
const TEMPLATE2 = './server/controllers/stock/reports/rumer_condensed.report.handlebars';

exports.report = report;

/**
 * @method report
 *
 * @description
 * This method builds the RUMER (Registre d’Utilisation des Médicaments Et Recettes) report
 * by month JSON, PDF, or HTML file to be sent to the client.
 *
 * GET /reports/stock/rumer_report
 */
async function report(req, res) {
  const output = await rumer.getData(req.query);
  const { params, data } = output;
  const template = params.condensed_report ? TEMPLATE2 : TEMPLATE1;
  const reporting = new ReportManager(template, req.session, params);
  const result = await reporting.render(data);
  res.set(result.headers).send(result.report);
}
