const {
  ReportManager, Stock, NotFound, db, barcode, pdf, identifiers,
  STOCK_EXIT_LOSS_TEMPLATE, POS_STOCK_EXIT_LOSS_TEMPLATE,
  getVoucherReferenceForStockMovement,
} = require('../common');

/**
 * @param documentUuid
 * @param session
 * @param options
 * @function stockExitLossReceipt
 * @description
 * This method builds the stock inventory report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /receipts/stock/exit_loss/:document_uuid
 */
async function stockExitLossReceipt(documentUuid, session, options) {
  const data = {};
  const optionReport = Object.assign(options, { filename : 'STOCK.RECEIPT.EXIT_LOSS' });
  const autoStockAccountingEnabled = session.stock_settings.enable_auto_stock_accounting;

  let template = STOCK_EXIT_LOSS_TEMPLATE;

  if (Number(optionReport.posReceipt)) {
    template = POS_STOCK_EXIT_LOSS_TEMPLATE;
    Object.assign(optionReport, pdf.posReceiptOptions);
  }

  // set up the report with report manager
  const report = new ReportManager(template, session, optionReport);

  const sql = `
    SELECT i.code, i.text,
      IF(ISNULL(iu.token), iu.text, CONCAT("INVENTORY.UNITS.",iu.token,".TEXT")) AS unit_type,
      BUID(m.document_uuid) AS document_uuid,
      m.quantity, m.unit_cost, (m.quantity * m.unit_cost) AS total , m.date, m.description,
      u.display_name AS user_display_name,
      dm.text AS document_reference,
      l.label, l.expiration_date, d.text AS depot_name, d.is_count_per_container,
      l.package_size, FLOOR(m.quantity / l.package_size) number_package,
      IF(l.package_size <= 1, 0, 1) AS displayDetail
    FROM stock_movement m
    JOIN lot l ON l.uuid = m.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN inventory_unit iu ON iu.id = i.unit_id
    JOIN depot d ON d.uuid = m.depot_uuid
    JOIN user u ON u.id = m.user_id
    LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
    WHERE m.is_exit = 1 AND m.flux_id = ${Stock.flux.TO_LOSS} AND m.document_uuid = ?
  `;

  const results = await Promise.all([
    db.exec(sql, [db.bid(documentUuid)]),
    getVoucherReferenceForStockMovement(documentUuid),
  ]);

  const rows = results[0];
  const voucherReference = results[1][0] ? results[1][0].voucher_reference : null;

  if (!rows.length) {
    throw new NotFound('document not found');
  }

  const line = rows[0];
  const { key } = identifiers.STOCK_EXIT;
  data.enterprise = session.enterprise;

  data.details = {
    depot_name         : line.depot_name,
    user_display_name  : line.user_display_name,
    description        : line.description,
    date               : line.date,
    document_uuid      : line.document_uuid,
    document_reference : line.document_reference,
    barcode : barcode.generate(key, line.document_uuid),
    voucher_reference : voucherReference,
    autoStockAccountingEnabled,
    depot_count_per_container : line.is_count_per_container,
  };

  data.displayPackagingDetails = session.stock_settings.enable_packaging_pharmaceutical_products
    && data.details.depot_count_per_container;

  data.rows = rows;
  return report.render(data);

}

module.exports = stockExitLossReceipt;
