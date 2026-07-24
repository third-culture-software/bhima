const {
  ReportManager, getDepotMovement, barcode, identifiers, STOCK_ENTRY_DEPOT_TEMPLATE,
} = require('../common');

// NOTE: These constants must match those in bhConstants.js (shipmentStatus)
const SHIPMENT_PARTIAL = 5;
const SHIPMENT_COMPLETE = 6;

const shipmentStatus = {};
shipmentStatus[SHIPMENT_PARTIAL] = 'SHIPMENT.STATUS.PARTIAL';
shipmentStatus[SHIPMENT_COMPLETE] = 'SHIPMENT.STATUS.COMPLETE';

/**
 * @param documentUuid
 * @param session
 * @param options
 * @function stockEntryDepotReceipt
 * @description
 * This method builds the stock inventory report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /receipts/stock/entry_depot/:document_uuid
 */
async function stockEntryDepotReceipt(documentUuid, session, options) {
  const optionReport = Object.assign(options, { filename : 'STOCK.RECEIPT.ENTRY_DEPOT' });

  // set up the report with report manager
  const report = new ReportManager(STOCK_ENTRY_DEPOT_TEMPLATE, session, optionReport);

  const allDelivered = rows => rows.every(row => row.total_quantity === row.quantity_sent);

  const data = await getDepotMovement(documentUuid, session.enterprise, false)

  data.rows = combineByLots(data.rows);
  const { key } = identifiers.STOCK_ENTRY;
  data.totals = { cost : data.rows.reduce((agg, row) => agg + row.total, 0) };
  data.entry.details.barcode = barcode.generate(key, data.entry.details.document_uuid);

  if (data.entry.details.shipment_reference) {
    data.entry.details.shipment_status_label = shipmentStatus[data.entry.details.shipment_status];
  }

  data.entry.details.partialDelivery = !allDelivered(data.rows);

  return report.render(data);
}

/**
 * Combines inventory movement rows by lot.
 *
 * Rows are sorted chronologically, then grouped by `lot_uuid`.
 * For each lot, the function calculates:
 * - total quantity received
 * - remaining quantity difference
 * - total inventory value
 * @param {Array<object>} rows - Inventory movement rows.
 * @param {string} rows[].lot_uuid - Unique identifier for the inventory lot.
 * @param {number} rows[].quantity - Quantity added by this movement.
 * @param {number} rows[].quantity_sent - Expected quantity sent for the lot.
 * @param {number} rows[].unit_cost - Unit cost of the inventory item.
 * @param {string|Date} rows[].date - Movement date used for ordering.
 * @returns {Array<object>} One summarized row per inventory lot.
 */
function combineByLots(rows) {
  const groupedLots = new Map();

  // Sort without mutating the original array
  const sortedRows = [...rows].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  for (const row of sortedRows) {
    const lotRows = groupedLots.get(row.lot_uuid) || [];
    lotRows.push(row);
    groupedLots.set(row.lot_uuid, lotRows);
  }

  return [...groupedLots.values()].map(lotRows => {
    return lotRows.reduce(
      (summary, row) => {
        const totalQuantity = summary.total_quantity + row.quantity;

        return {
          ...row,
          total_quantity: totalQuantity,
          quantity_difference: row.quantity_sent - totalQuantity,
          total: totalQuantity * row.unit_cost
        };
      },
      { total_quantity: 0 }
    );
  });
}


module.exports = stockEntryDepotReceipt;
