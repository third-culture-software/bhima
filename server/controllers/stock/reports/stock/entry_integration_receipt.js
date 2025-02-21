const {
  _, ReportManager, Stock, NotFound, db, barcode, identifiers, STOCK_ENTRY_INTEGRATION_TEMPLATE,
  getVoucherReferenceForStockMovement,
} = require('../common');

/**
 * @method stockEntryIntegrationReceipt
 *
 * @description
 * This method builds the stock inventory report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /receipts/stock/entry_integration/:document_uuid
 */
async function stockEntryIntegrationReceipt(documentUuid, session, options) {
  const data = {};
  const optionReport = _.extend(options, { filename : 'STOCK.RECEIPT.ENTRY_INTEGRATION' });
  const autoStockAccountingEnabled = session.stock_settings.enable_auto_stock_accounting;

  // set up the report with report manager
  const report = new ReportManager(STOCK_ENTRY_INTEGRATION_TEMPLATE, session, optionReport);

  const sql = `
    SELECT i.code, i.text, BUID(m.document_uuid) AS document_uuid,
      m.quantity, m.unit_cost, (m.quantity * m.unit_cost) AS total , m.date, m.description,
      u.display_name AS user_display_name,
      l.label, l.expiration_date, d.text AS depot_name, d.is_count_per_container,
      m.description, ig.tracking_expiration,
      IF(ig.tracking_expiration = 1, TRUE, FALSE) as expires,
      dm.text as document_reference, l.package_size, FLOOR(m.quantity / l.package_size) number_package,
      IF(l.package_size <= 1, 0, 1) AS displayDetail,
      fs.label AS funding_source_label
    FROM stock_movement m
    JOIN lot l ON l.uuid = m.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN inventory_group ig ON ig.uuid = i.group_uuid
    JOIN depot d ON d.uuid = m.depot_uuid
    JOIN user u ON u.id = m.user_id
    LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
    LEFT JOIN funding_source fs ON fs.uuid = l.funding_source_uuid
    WHERE m.is_exit = 0 AND m.flux_id = ${Stock.flux.FROM_INTEGRATION} AND m.document_uuid = ?
    ORDER BY i.text, l.label
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
  const { key } = identifiers.STOCK_ENTRY;

  data.enterprise = session.enterprise;

  data.details = {
    depot_name            : line.depot_name,
    user_display_name     : line.user_display_name,
    description           : line.description,
    date                  : line.date,
    document_uuid         : line.document_uuid,
    document_reference    : line.document_reference,
    project_display_name  : line.project_display_name,
    barcode : barcode.generate(key, line.document_uuid),
    voucher_reference     : voucherReference,
    autoStockAccountingEnabled,
    depot_count_per_container : line.is_count_per_container,
    funding_source_label      : line.funding_source_label,
  };

  data.displayPackagingDetails = session.stock_settings.enable_packaging_pharmaceutical_products
    && data.details.depot_count_per_container;

  data.rows = rows;
  return report.render(data);

}

module.exports = stockEntryIntegrationReceipt;
