const {
  ReportManager, Stock, formatFilters, STOCK_INLINE_MOVEMENTS_REPORT_TEMPLATE,
} = require('../common');

const i18n = require('../../../../lib/helpers/translate');

/**
 * @param req
 * @param res
 * @function stockInlineMovementsReport
 * @description
 * This method builds the stock movements report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/inline-movements
 */
async function stockInlineMovementsReport(req, res) {
  const { lang } = req.query;
  const optionReport = Object.assign(req.query, {
    filename : 'TREE.STOCK_INLINE_MOVEMENTS',
    csvKey : 'rows',
  });

  // set up the report with report manager
  const report = new ReportManager(STOCK_INLINE_MOVEMENTS_REPORT_TEMPLATE, req.session, optionReport);

  const params = req.query;

  if (req.session.stock_settings.enable_strict_depot_permission) {
    params.check_user_id = req.session.user.id;
  }

  const rows = await Stock.getMovements(null, params);

  const purgeKeys = ['depot_uuid', 'document_uuid', 'entity_uuid', 'flux_id', 'invoice_uuid',
    'is_exit', 'stock_requisition_uuid',
  ];

  rows.forEach(row => {
    // Purge unneeded fields from the row
    purgeKeys.forEach(key => {
      delete row[key];
    });

    // Translate the Flux type
    row.fluxName = i18n(lang)(row.flux_label);
    delete row.flux_label;
  });

  const data = {
    rows,
    filters : formatFilters(req.query),
  };

  data.depots = Object.groupBy(rows, row => row.depot_text);

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

module.exports = stockInlineMovementsReport;
