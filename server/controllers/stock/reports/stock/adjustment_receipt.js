const {
  ReportManager, Stock, NotFound, db, identifiers, barcode, STOCK_ADJUSTMENT_TEMPLATE,
  getVoucherReferenceForStockMovement,
} = require('../common');

/**
 * @param documentUuid
 * @param session
 * @param options
 * @function stockAdjustmentReceipt
 * @description
 * This method builds the stock adjustment receipt file to be sent to the client.
 */
async function stockAdjustmentReceipt(documentUuid, session, options) {
  const optionReport = Object.assign(options, { filename : 'STOCK.RECEIPT.ADJUSTMENT' });
  const autoStockAccountingEnabled = session.stock_settings.enable_auto_stock_accounting;

  const FLUX_TYPE = [
    Stock.flux.FROM_ADJUSTMENT,
    Stock.flux.TO_ADJUSTMENT,
    Stock.flux.INVENTORY_RESET,
    Stock.flux.INVENTORY_ADJUSTMENT,
  ];

  // set up the report with report manager
  const report = new ReportManager(STOCK_ADJUSTMENT_TEMPLATE, session, optionReport);
  const sql = `
    SELECT i.code, i.text, BUID(m.document_uuid) AS document_uuid, m.is_exit,
      m.quantity, m.unit_cost, (m.quantity * m.unit_cost) AS total , m.date, m.description,
      u.display_name AS user_display_name, dm.text AS document_reference,
      l.label, l.expiration_date, d.text AS depot_name, m.flux_id,
      sal.new_quantity, sal.old_quantity, (sal.new_quantity - sal.old_quantity) AS difference
    FROM stock_movement m
      LEFT JOIN stock_adjustment_log sal ON sal.movement_uuid = m.uuid
      JOIN document_map dm ON dm.uuid = m.document_uuid
      JOIN lot l ON l.uuid = m.lot_uuid
      JOIN inventory i ON i.uuid = l.inventory_uuid
      JOIN depot d ON d.uuid = m.depot_uuid
      JOIN user u ON u.id = m.user_id
    WHERE m.flux_id IN (${FLUX_TYPE}) AND m.document_uuid = ?
  `;

  const [rows, [references]] = await Promise.all([
    db.exec(sql, [db.bid(documentUuid)]),
    getVoucherReferenceForStockMovement(documentUuid),
  ]);

  const voucherReference = references && references.voucher_reference;

  if (!rows.length) {
    throw new NotFound(`Could not find document with uuid: ${documentUuid}`);
  }

  const line = rows[0];
  const { key } = identifiers.STOCK_MOVEMENT;
  const data = {};
  data.enterprise = session.enterprise;

  const FLUX_TITLE = {
    3 : 'STOCK_FLUX.FROM_ADJUSTMENT',
    12 : 'STOCK_FLUX.TO_ADJUSTMENT',
    14 : 'STOCK_FLUX.INVENTORY_RESET',
    15 : 'STOCK_FLUX.INVENTORY_ADJUSTMENT',
  };

  data.details = {
    title              : FLUX_TITLE[line.flux_id],
    is_exit            : line.is_exit,
    flux_id            : line.flux_id,
    depot_name         : line.depot_name,
    user_display_name  : line.user_display_name,
    description        : line.description,
    date               : line.date,
    document_uuid      : line.document_uuid,
    document_reference : line.document_reference,
    barcode : barcode.generate(key, line.document_uuid),
    voucher_reference : voucherReference,
    autoStockAccountingEnabled,
  };

  data.rows = rows;

  if (data.details.flux_id === Stock.flux.INVENTORY_ADJUSTMENT) {
    data.increasedAdjustment = rows.map(computeTotal).filter(item => item.is_exit === 0);
    data.decreasedAdjustment = rows.map(computeTotal).filter(item => item.is_exit === 1);
  }

  return report.render(data);
}

/**
 *
 * @param item
 */
function computeTotal(item) {
  item.total = item.unit_cost * item.quantity;
  return item;
}

module.exports = stockAdjustmentReceipt;
