const {
  _,
  ReportManager,
  SATISFACTION_RATE_REPORT_TEMPLATE,
} = require('../common');

const satisfaction = require('./satisfaction');

/**
 * satisfactionRateReport
 *
 * This method builds the satisfaction rate report as either a
 * JSON, PDF, or HTML file to be sent to the client.
 *
 * GET '/reports/stock/satisfaction_rate_report'
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 */
async function satisfactionRateReport(req, res) {
  const result = await reporting(req.query, req.session);
  res.set(result.headers).send(result.report);
}

async function reporting(_options, session) {
  const {
    dateFrom, dateTo, includeQuantityDetails, includeSummary,
  } = _options;

  const optionReport = _.extend(_options, {
    filename : 'TREE.SATISFACTION_RATE_REPORT',
  });

  const report = new ReportManager(
    SATISFACTION_RATE_REPORT_TEMPLATE,
    session,
    optionReport,
  );

  const { depotUuids } = optionReport;

  const data = await satisfaction.getSatisfactionData({
    dateFrom,
    dateTo,
    depotUuids,
  });

  optionReport.suppliersListe = data.suppliersList;
  optionReport.includeQuantityDetails = includeQuantityDetails === '1';
  optionReport.includeSummary = includeSummary === '1';

  let totalBeneficiary = 0;
  let totalSatisfactionItem = 0;
  let totalSatisfactionQuantity = 0;
  data.depotsListSupplier.map(supplier => {
    supplier.data.forEach(beneficiary => {
      totalBeneficiary += 1;
      if (beneficiary.depot_requisition && beneficiary.depot_requisition.satisfaction_rate_item * 100 >= 80) {
        totalSatisfactionItem += 1;
      }
      if (beneficiary.depot_requisition && beneficiary.depot_requisition.satisfaction_rate_quantity * 100 >= 80) {
        totalSatisfactionQuantity += 1;
      }
    });
    return supplier;
  });

  const summary = {};
  summary.totalBeneficiary = totalBeneficiary;
  summary.totalSatisfactionItem = totalSatisfactionItem;
  summary.totalSatisfactionItemRate = totalSatisfactionItem / (!totalBeneficiary ? 1 : totalBeneficiary);
  summary.totalSatisfactionQuantity = totalSatisfactionQuantity;
  summary.totalSatisfactionQuantityRate = totalSatisfactionQuantity / (!totalBeneficiary ? 1 : totalBeneficiary);
  optionReport.summary = summary;

  // export option
  data.option = optionReport;

  return report.render(data);
}

module.exports = satisfactionRateReport;
