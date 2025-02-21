const {
  _, ReportManager, Stock, identifiers, NotFound, db, barcode,
  STOCK_ENTRY_PURCHASE_TEMPLATE,
  getVoucherReferenceForStockMovement,
} = require('../common');

const Exchange = require('../../../finance/exchange');

/**
 * @method stockEntryPurchaseReceipt
 *
 * @description
 * This method builds the stock inventory report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 */
async function stockEntryPurchaseReceipt(documentUuid, session, options) {
  const data = {};
  const optionReport = _.extend(options, { filename : 'STOCK.RECEIPT.ENTRY_PURCHASE' });
  const autoStockAccountingEnabled = session.stock_settings.enable_auto_stock_accounting;

  // set up the report with report manager
  const report = new ReportManager(STOCK_ENTRY_PURCHASE_TEMPLATE, session, optionReport);

  const smSql = `
    SELECT i.code, i.text, BUID(i.uuid) as inventory_uuid,
      BUID(m.document_uuid) AS document_uuid,
      m.quantity, m.unit_cost, (m.quantity * m.unit_cost) AS total , m.date, m.description,
      u.display_name AS user_display_name,
      l.label, l.expiration_date, d.text AS depot_name, d.is_count_per_container,
      dm2.text AS purchase_reference,
      p.note, p.cost, p.shipping_handling, p.currency_id, BUID(p.uuid) as po_uuid,
      p.date AS purchase_date, p.payment_method, s.display_name AS supplier_display_name,
      dm.text as document_reference, ig.tracking_expiration,
      IF(ig.tracking_expiration = 1, TRUE, FALSE) as expires,
      l.package_size, FLOOR(m.quantity / l.package_size) number_package,
      IF(l.package_size <= 1, 0, 1) AS displayDetail,
      fs.label AS funding_source_label
    FROM stock_movement m
      JOIN lot l ON l.uuid = m.lot_uuid
      JOIN inventory i ON i.uuid = l.inventory_uuid
      JOIN inventory_group ig ON ig.uuid = i.group_uuid
      JOIN depot d ON d.uuid = m.depot_uuid
      JOIN user u ON u.id = m.user_id
      LEFT JOIN purchase p ON p.uuid = m.entity_uuid
      LEFT JOIN supplier s ON s.uuid = p.supplier_uuid
      LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
      LEFT JOIN document_map dm2 ON dm2.uuid = m.entity_uuid
      LEFT JOIN funding_source fs ON fs.uuid = l.funding_source_uuid
    WHERE m.is_exit = 0 AND m.flux_id = ${Stock.flux.FROM_PURCHASE} AND m.document_uuid = ?
    ORDER BY i.text, l.label
  `;

  const results = await Promise.all([
    db.exec(smSql, [db.bid(documentUuid)]),
    getVoucherReferenceForStockMovement(documentUuid),
  ]);

  const rows = results[0];
  if (!rows.length) {
    throw new NotFound(`document not found`);
  }

  if (rows[0].po_uuid === null) {
    throw new NotFound(`Could not reconstruct document for old stock movement ${rows[0].document_reference}`);
  }

  const poUuid = rows[0].po_uuid;
  const voucherReference = results[1][0] ? results[1][0].voucher_reference : null;

  // Get the information about the original PO lots
  const poSql = `
     SELECT BUID(inventory_uuid) as inventory_uuid, quantity, unit_price
     FROM purchase_item WHERE purchase_uuid = ?;
     `;
  const poInventoryArticles = await db.exec(poSql, [db.bid(poUuid)]);

  // Count the total number of items to see if the order is complete
  const poTotalQuantity = poInventoryArticles.reduce((accum, lot) => accum + lot.quantity, 0);

  const line = rows[0];
  const { key } = identifiers.STOCK_ENTRY;

  data.enterprise = session.enterprise;

  // Set up flag for handlebars
  data.not_in_enterprise_currency = session.enterprise.currency_id !== line.currency_id;

  // Get the exchange rate (multiply by this to convert enterprise to PO currency)
  const exchange = await Exchange.getExchangeRate(session.enterprise.id, line.currency_id, new Date());
  const exRate = exchange.rate || 1;

  data.details = {
    depot_name            : line.depot_name,
    user_display_name     : line.user_display_name,
    description           : line.description,
    date                  : line.date,
    document_uuid         : line.document_uuid,
    document_reference    : line.document_reference,
    purchase_reference    : line.purchase_reference,

    exchangeRate          : exRate,
    p_currency_id         : line.currency_id, // PO currency
    p_shipping_handling   : line.shipping_handling, // Shipping+handling cost of full order (in PO currency)
    p_full_cost           : line.cost, // Cost of full order not including shipping+handling (in PO currency)

    p_note                : line.note,
    p_date                : line.purchase_date,
    p_method              : line.payment_method,
    supplier_display_name : line.supplier_display_name,
    barcode               : barcode.generate(key, line.document_uuid),
    voucher_reference     : voucherReference,
    autoStockAccountingEnabled,
    depot_count_per_container : line.is_count_per_container,
    funding_source_label : line.funding_source_label,
  };

  // Set up flag for handlebars
  data.not_in_enterprise_currency = session.enterprise.currency_id !== data.details.p_currency_id;

  data.displayPackagingDetails = session.stock_settings.enable_packaging_pharmaceutical_products
    && data.details.depot_count_per_container;

  // Add the original PO unit cost and quantity for each lot
  let sumCost = 0.0;
  let delivTotalQuantity = 0;
  rows.forEach(row => {
    // Get the article quantity and unit cost from the original PO
    const poLot = poInventoryArticles.find(p => p.inventory_uuid === row.inventory_uuid);
    row.p_quantity = poLot.quantity;
    row.p_unit_cost = poLot.unit_price;

    // Unit cost without shipping+handling (in PO currency)
    row.unit_cost_base = row.p_unit_cost;

    // Compute actual unit_cost of the delivery including S&H (in PO currency)
    // Note: row.unit_cost is from the stock_movement table.  It is in enterprise
    //      currency and may include the distributed shipping+handling costs.
    row.unit_cost_deliv = row.unit_cost * exRate;

    // Compute the total cost for this article in the delivery (in PO currency)
    // (May include distributed shipping+handling costs)
    row.cost_deliv = row.unit_cost_deliv * row.quantity;

    sumCost += row.cost_deliv;
    delivTotalQuantity += row.quantity;
  });

  // Compute the total cost of all delivered articles (in PO currency)
  // (This also includes distributed shipping+handling costs)
  data.details.total_cost_deliv = sumCost;

  // Compute the total cost of the original PO including shipping+handling (in PO currency)
  data.details.p_total_cost = data.details.p_full_cost + data.details.p_shipping_handling;
  data.details.p_total_cost_equiv = data.details.p_total_cost / exRate; // Enterprise currency

  data.details.total_cost_deliv_equiv = data.details.total_cost_deliv / exRate; // Enterprise currency

  data.details.p_shipping_handling_equiv = data.details.p_shipping_handling / exRate; // Enterprise currency

  // Set a flag to indicate if the order has been completely received
  data.details.order_complete = delivTotalQuantity >= poTotalQuantity;

  // For report table formatting
  data.ncols = data.details.p_shipping_handling ? 7 : 6;
  data.ncols = data.displayPackagingDetails ? data.ncols + 1 : data.ncols;

  data.rows = rows;

  return report.render(data);
}

module.exports = stockEntryPurchaseReceipt;
