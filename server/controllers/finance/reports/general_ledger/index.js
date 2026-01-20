/**
 * @overview General Ledger Accounts Reports
 *
 * @description
 * This module contains all the code for rendering PDFs of the general ledgers.
 * It should really use the same code as the accounts reports.
 */

const Tree = require('@ima-worldhealth/tree');

const ReportManager = require('../../../../lib/ReportManager');
const GeneralLedger = require('../../generalLedger');

const REPORT_TEMPLATE = './server/controllers/finance/reports/general_ledger/report.handlebars';

exports.report = renderReport;

/**
 * GET reports/finance/general_ledger
 *
 * @method report
 */
async function renderReport(req, res) {
  const options = {
    ...req.query,
    filename : 'TREE.GENERAL_LEDGER',
    orientation : 'landscape',
    csvKey   : 'rows',
  };

  const report = new ReportManager(REPORT_TEMPLATE, req.session, options);

  const fiscalYearId = options.fiscal_year_id;
  const TITLE_ACCOUNT_ID = 6;

  const [rows, aggregates] = await Promise.all([
    GeneralLedger.getAccountTotalsMatrix(fiscalYearId),
    GeneralLedger.getAccountTotalsMatrixAggregates(fiscalYearId),
  ]);

  const tree = new Tree(rows);

  tree.walk((node, parentNode) => {
    Tree.common.computeNodeDepth(node, parentNode);

    node.isTitleAccount = node.type_id === TITLE_ACCOUNT_ID;
    node.padLeft = node.depth * 15;
  });

  const data = { rows : tree.toArray(), footer : aggregates[0] };
  data.fiscal_year_label = options.fiscal_year_label;
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}
