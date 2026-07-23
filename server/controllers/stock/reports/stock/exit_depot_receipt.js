const {
  ReportManager, getDepotMovement, pdf, identifiers, barcode,
  STOCK_EXIT_DEPOT_TEMPLATE, POS_STOCK_EXIT_DEPOT_TEMPLATE,
} = require('../common');

/**
 * @param documentUuid
 * @param session
 * @param options
 * @function stockExitDepotReceipt
 * @description
 * This method builds the stock inventory report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /receipts/stock/exit_depot/:document_uuid
 */
async function stockExitDepotReceipt(documentUuid, session, options) {
  const optionReport = Object.assign(options, { filename : 'STOCK.RECEIPT.EXIT_DEPOT' });
  let template = STOCK_EXIT_DEPOT_TEMPLATE;

  if (Number(optionReport.posReceipt)) {
    template = POS_STOCK_EXIT_DEPOT_TEMPLATE;
    Object.assign(optionReport, pdf.posReceiptOptions);
  }

  // set up the report with report manager
  const report = new ReportManager(template, session, optionReport);

  const data = await getDepotMovement(documentUuid, session.enterprise, true)
  const { key } = identifiers.STOCK_EXIT;

  data.displayPackagingDetails = session.stock_settings.enable_packaging_pharmaceutical_products
  && data.exit.details.depot_count_per_container;

  // get the total cost of the movement
  data.totals = { cost : data.rows.reduce((agg, row) => agg + row.total, 0) };

  data.exit.details.barcode = barcode.generate(key, data.exit.details.document_uuid);

  // Customize the message for shipments
  return report.render(data);
}

module.exports = stockExitDepotReceipt;
