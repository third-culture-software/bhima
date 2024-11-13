// Constants
const BASE_PATH = './server/controllers/stock/reports';
const path = require('path');

// shortcut: uses the name of the file and adds the path and extension
const mkPath = name => path.join(BASE_PATH, name).concat('.handlebars');

// receipts
const STOCK_EXIT_PATIENT_TEMPLATE = mkPath('stock_exit_patient.receipt');

const POS_STOCK_EXIT_PATIENT_TEMPLATE = mkPath('stock_exit_patient.receipt.pos');
const STOCK_EXIT_SERVICE_TEMPLATE = mkPath('stock_exit_service.receipt');
const POS_STOCK_EXIT_SERVICE_TEMPLATE = mkPath('stock_exit_service.receipt.pos');
const STOCK_EXIT_DEPOT_TEMPLATE = mkPath('stock_exit_depot.receipt');
const POS_STOCK_EXIT_DEPOT_TEMPLATE = mkPath('stock_exit_depot.receipt.pos');
const STOCK_EXIT_LOSS_TEMPLATE = mkPath('/stock_exit_loss.receipt');
const POS_STOCK_EXIT_LOSS_TEMPLATE = mkPath('stock_exit_loss.receipt.pos');
const STOCK_ASSIGN_TEMPLATE = mkPath('stock/assignment/stock_assign.receipt');
const STOCK_ASSIGN_REGISTRY_TEMPLATE = mkPath('/stock/assignment/stock_assign.registry');
const STOCK_CONSUMPTION_GRAPTH_TEMPLATE = mkPath('/stock_consumption_graph');
const STOCK_MOVEMENT_REPORT_TEMPLATE = mkPath('/stock_movement_report');
const LOT_BARCODE_TEMPLATE = mkPath('/stock/lot_barcode/lot_barcode');

const STOCK_ENTRY_DEPOT_TEMPLATE = mkPath('/stock_entry_depot.receipt');
const STOCK_ENTRY_PURCHASE_TEMPLATE = mkPath('/stock_entry_purchase.receipt');
const STOCK_ENTRY_INTEGRATION_TEMPLATE = mkPath('/stock_entry_integration.receipt');
const STOCK_ENTRY_DONATION_TEMPLATE = mkPath('/stock_entry_donation.receipt');
const STOCK_ADJUSTMENT_TEMPLATE = mkPath('/stock_adjustment.receipt');

const STOCK_AGGREGATE_CONSUMPTION_TEMPLATE = mkPath('/stock_aggregate_consumption.receipt');

// reports
const STOCK_AVG_MED_COSTS_PER_PATIENT_TEMPLATE = mkPath('/stock_avg_med_costs_per_patient.report');
const STOCK_EXIT_REPORT_TEMPLATE = mkPath('/stock_exit.report');
const STOCK_ENTRY_REPORT_TEMPLATE = mkPath('/stock_entry.report');
const STOCK_LOST_STOCK_REPORT_TEMPLATE = mkPath('/stock_lost_stock.report');
const STOCK_LOTS_REPORT_TEMPLATE = mkPath('/stock_lots.report');
const STOCK_MOVEMENTS_REPORT_TEMPLATE = mkPath('/stock_movements.report');
const STOCK_INLINE_MOVEMENTS_REPORT_TEMPLATE = mkPath('/stock_inline_movements.report');
const STOCK_INVENTORIES_REPORT_TEMPLATE = mkPath('/stock_inventories.report');
const STOCK_SHEET_REPORT_TEMPLATE = mkPath('/stock_sheet.report');
const STOCK_VALUE_REPORT_TEMPLATE = mkPath('/stock_value.report');
const STOCK_EXPIRATION_REPORT_TEMPLATE = mkPath('/stock_expiration_report');
const STOCK_AGGREGATED_CONSUMPTION_REPORT_TEMPLATE = mkPath('/stock_aggregated_consumption_report');
const SATISFACTION_RATE_REPORT_TEMPLATE = mkPath('/satisfaction_rate_report');

const ASSETS_REGISTRY_TEMPLATE = mkPath('/assets_registry.report');

// General imports
const _ = require('lodash');
const moment = require('moment');

// Application-specific imports
const db = require('../../../lib/db');
const util = require('../../../lib/util');
const Stock = require('../core');
const ReportManager = require('../../../lib/ReportManager');
const NotFound = require('../../../lib/errors/NotFound');
const identifiers = require('../../../config/identifiers');
const pdf = require('../../../lib/renderers/pdf');
const barcode = require('../../../lib/barcode');
const { formatFilters } = require('../../finance/reports/shared');

/**
 * getDepotMovement
 * @param {string} documentUuid
 * @param {object} enterprise
 * @param {boolean} isExit
 * @description return depot movements information
 * @return {object} data
 */
async function getDepotMovement(documentUuid, enterprise, isExit) {
  const data = {};
  const isExitValue = isExit ? 1 : 0;
  const isEntry = isExitValue === 0;

  const lookupExitParameters = [1, Stock.flux.TO_OTHER_DEPOT, db.bid(documentUuid)];
  const lookupEntryParameters = [0, Stock.flux.FROM_OTHER_DEPOT, db.bid(documentUuid)];
  const parameters = isEntry ? lookupExitParameters.concat(lookupEntryParameters) : lookupExitParameters;

  const joinToExitAttributes = isEntry ? `
    , IFNULL(ex.quantity, 0) AS quantity_sent, IFNULL((ex.quantity - m.quantity), 0) AS quantity_difference
    ` : '';

  const joinToExit = isEntry ? `
    LEFT JOIN (
      SELECT m.document_uuid, m.lot_uuid, m.quantity
      FROM stock_movement m
      WHERE m.is_exit = ? AND m.flux_id = ? AND m.document_uuid = ?
    ) ex ON ex.document_uuid = m.document_uuid AND ex.lot_uuid = m.lot_uuid
    ` : '';

  const sql = `
    SELECT
      BUID(l.uuid) AS lot_uuid, i.code, i.text,
      IF(ISNULL(iu.token), iu.text, CONCAT("INVENTORY.UNITS.",iu.token,".TEXT")) AS unit_type,
      BUID(m.document_uuid) AS document_uuid,
      m.quantity, m.unit_cost, (m.quantity * m.unit_cost) AS total, m.date, m.description,
      u.display_name AS user_display_name,
      dm.text AS document_reference,
      l.label, l.expiration_date, d.text AS depot_name, d.is_count_per_container, dd.text as otherDepotName,
      dm.text as document_reference, l.package_size, FLOOR(m.quantity / l.package_size) number_package,
      IF(l.package_size <= 1, 0, 1) AS displayDetail,
      BUID(m.stock_requisition_uuid) AS stock_requisition_uuid, sr_m.text AS document_requisition,
      BUID(s.uuid) AS shipment_uuid, s.status_id AS shipment_status, ship_dm.text AS shipment_reference
      ${joinToExitAttributes}
    FROM stock_movement m
      JOIN lot l ON l.uuid = m.lot_uuid
      JOIN inventory i ON i.uuid = l.inventory_uuid
      JOIN inventory_unit iu ON iu.id = i.unit_id
      JOIN depot d ON d.uuid = m.depot_uuid
      JOIN user u ON u.id = m.user_id
      LEFT JOIN depot dd ON dd.uuid = entity_uuid
      LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
      LEFT JOIN document_map sr_m ON sr_m.uuid = m.stock_requisition_uuid
      LEFT JOIN shipment s ON s.document_uuid = m.document_uuid
      LEFT JOIN document_map ship_dm ON ship_dm.uuid = s.uuid
      ${joinToExit}
    WHERE m.is_exit = ? AND m.flux_id = ? AND m.document_uuid = ?
    ORDER BY i.text, l.label, l.expiration_date DESC`;

  const rows = await db.exec(sql, parameters);

  if (!rows.length) { throw new NotFound('document not found'); }

  const line = rows[0];

  data.enterprise = enterprise;
  const key = isExit ? 'exit' : 'entry';
  data[key] = {};

  data[key].details = {
    depot_name         : line.depot_name,
    otherDepotName     : line.otherDepotName || '',
    user_display_name  : line.user_display_name,
    description        : line.description,
    date               : line.date,
    document_uuid      : line.document_uuid,
    document_reference : line.document_reference,
    document_requisition : line.document_requisition,
    shipment_uuid      : line.shipment_uuid,
    shipment_status    : line.shipment_status,
    shipment_reference : line.shipment_reference,
    depot_count_per_container : line.is_count_per_container,
  };

  data.rows = rows;

  return data;
}

// Extensible PDF layout options
const pdfOptions = {
  orientation : 'landscape',
};

async function getVoucherReferenceForStockMovement(documentUuid) {
  const sql = `
    SELECT v.uuid, dm.text AS voucher_reference
    FROM voucher AS v
      JOIN voucher_item AS vi ON vi.voucher_uuid = v.uuid
      JOIN document_map AS dm ON dm.uuid = v.uuid
    WHERE vi.document_uuid = ?
    LIMIT 1;
  `;

  return db.exec(sql, [db.bid(documentUuid)]);
}

/**
 * Stock Receipt API
 * /receipts/stock/{{name}}/:document_uuid
 *
 * the {{name}} is what we define for example in { key : 'FROM_PURCHASE', path :'entry_purchase' },
 *
 * empty {{name}} means that there is no API entry for this name.
 */
const stockFluxReceipt = {
  1  : { key : 'FROM_PURCHASE', path : 'entry_purchase' },
  2  : { key : 'FROM_OTHER_DEPOT', path : 'entry_depot' },
  3  : { key : 'FROM_ADJUSTMENT', path : 'adjustment' },
  4  : { key : 'FROM_PATIENT', path : '' },
  5  : { key : 'FROM_SERVICE', path : '' },
  6  : { key : 'FROM_DONATION', path : 'entry_donation' },
  7  : { key : 'FROM_LOSS', path : 'entry_loss' },
  8  : { key : 'TO_OTHER_DEPOT', path : 'exit_depot' },
  9  : { key : 'TO_PATIENT', path : 'exit_patient' },
  10 : { key : 'TO_SERVICE', path : 'exit_service' },
  11 : { key : 'TO_LOSS', path : 'exit_loss' },
  12 : { key : 'TO_ADJUSTMENT', path : 'adjustment' },
  13 : { key : 'FROM_INTEGRATION', path : 'entry_integration' },
  14 : { key : 'INVENTORY_RESET', path : 'adjustment' },
  15 : { key : 'INVENTORY_ADJUSTMENT', path : 'adjustment' },
};

// Stock status label keys
// WARNING: Must match stockStatusLabelKeys in client StockService
const stockStatusLabelKeys = {
  stock_out         : 'STOCK.STATUS.STOCK_OUT',
  in_stock          : 'STOCK.STATUS.IN_STOCK',
  security_reached  : 'STOCK.STATUS.SECURITY',
  minimum_reached   : 'STOCK.STATUS.MINIMUM',
  over_maximum      : 'STOCK.STATUS.OVER_MAX',
  unused_stock      : 'STOCK.STATUS.UNUSED_STOCK',
};

// Exports
module.exports = {
  _,
  moment,
  db,
  util,
  pdf,
  barcode,
  Stock,
  ReportManager,
  NotFound,
  stockFluxReceipt,
  formatFilters,
  identifiers,
  getDepotMovement,
  getVoucherReferenceForStockMovement,
  pdfOptions,
  stockStatusLabelKeys,
  STOCK_EXIT_PATIENT_TEMPLATE,
  POS_STOCK_EXIT_PATIENT_TEMPLATE,
  STOCK_EXIT_SERVICE_TEMPLATE,
  POS_STOCK_EXIT_SERVICE_TEMPLATE,
  STOCK_EXIT_DEPOT_TEMPLATE,
  POS_STOCK_EXIT_DEPOT_TEMPLATE,
  STOCK_EXIT_LOSS_TEMPLATE,
  POS_STOCK_EXIT_LOSS_TEMPLATE,
  STOCK_ASSIGN_TEMPLATE,
  STOCK_ASSIGN_REGISTRY_TEMPLATE,
  STOCK_AVG_MED_COSTS_PER_PATIENT_TEMPLATE,
  STOCK_ENTRY_DEPOT_TEMPLATE,
  STOCK_ENTRY_PURCHASE_TEMPLATE,
  STOCK_ENTRY_INTEGRATION_TEMPLATE,
  STOCK_ENTRY_DONATION_TEMPLATE,
  STOCK_ADJUSTMENT_TEMPLATE,
  STOCK_EXIT_REPORT_TEMPLATE,
  STOCK_ENTRY_REPORT_TEMPLATE,
  STOCK_LOST_STOCK_REPORT_TEMPLATE,
  STOCK_LOTS_REPORT_TEMPLATE,
  LOT_BARCODE_TEMPLATE,
  STOCK_MOVEMENTS_REPORT_TEMPLATE,
  STOCK_INLINE_MOVEMENTS_REPORT_TEMPLATE,
  STOCK_SHEET_REPORT_TEMPLATE,
  STOCK_INVENTORIES_REPORT_TEMPLATE,
  STOCK_VALUE_REPORT_TEMPLATE,
  STOCK_CONSUMPTION_GRAPTH_TEMPLATE,
  STOCK_MOVEMENT_REPORT_TEMPLATE,
  STOCK_EXPIRATION_REPORT_TEMPLATE,
  STOCK_AGGREGATE_CONSUMPTION_TEMPLATE,
  STOCK_AGGREGATED_CONSUMPTION_REPORT_TEMPLATE,
  ASSETS_REGISTRY_TEMPLATE,
  SATISFACTION_RATE_REPORT_TEMPLATE,
};
