/**
 * @overview
 * Stock Reports
 *
 * This module is responsible for rendering reports of stock.
 *
 * @module stock/reports/
 */

const BadRequest = require('../../../lib/errors/BadRequest');
const db = require('../../../lib/db');
const Stock = require('../core');

const stockAvgMedCostsPerPatientReport = require('./stock/avg_med_costs_per_patient_report');
const stockExitReport = require('./stock/exit_report');
const stockEntryReport = require('./stock/entry_report');

const expirationReport = require('./stock/expiration_report');
const stockLotsReport = require('./stock/lots_report');
const stockMovementsReport = require('./stock/movements_report');
const stockInlineMovementsReport = require('./stock/inline_movements_report');
const stockInventoriesReport = require('./stock/inventories_report');
const stockSheetReport = require('./stock/stock_sheet');
const stockAggregatedConsumptionReport = require('./stock/aggregated_consumption_report');
const lostStockReport = require('./stock/lost_stock_report');
const satisfactionRateReport = require('./stock/satisfaction_rate_report');
const satisfactionRates = require('./stock/satisfaction_rate_data');

const stockExitPatientReceipt = require('./stock/exit_patient_receipt');
const stockExitDepotReceipt = require('./stock/exit_depot_receipt');
const stockExitAggregateConsumptionReceipt = require('./stock/exit_aggregate_consumption_receipt');
const stockEntryDepotReceipt = require('./stock/entry_depot_receipt');
const stockExitServiceReceipt = require('./stock/exit_service_receipt');
const stockExitLossReceipt = require('./stock/exit_loss_receipt');
const stockEntryPurchaseReceipt = require('./stock/entry_purchase_receipt');
const stockEntryIntegrationReceipt = require('./stock/entry_integration_receipt');
const stockEntryDonationReceipt = require('./stock/entry_donation_receipt');
const stockAdjustmentReceipt = require('./stock/adjustment_receipt');
const stockValue = require('./stock/value');
const stockAssignmentReceipt = require('./stock/assignment/stock_assign.receipt');
const stockAssignReport = require('./stock/assignment/stock_assign.registry');
const stockRequisitionReceipt = require('../requisition/requisition.receipt');
const lotBarcodeReceipt = require('./stock/lot_barcode/lot_barcode');

/**
  * @function determineReceiptType
  *
  * @description
  * Figures out the type of stock receipt from the document uuid.  This allows
  * a uniform API for rendering all stock receipts.
  */
async function determineReceiptType(uuid, isDepotTransferExit = -1) {

  // this is only used when you are rendering receipt for transfering between depots
  // to determine which receipt to render - the exit or the entry.
  const directionality = isDepotTransferExit > -1
    ? `AND is_exit = ${isDepotTransferExit}` : '';

  const sql = `
     SELECT document_uuid, flux_id FROM stock_movement
     WHERE document_uuid = ? ${directionality}
     LIMIT 1;
   `;

  const row = await db.one(sql, db.bid(uuid));
  return row.flux_id;
}

async function renderStockReceipt(req, res, next) {
  try {
    const documentUuid = req.params.uuid;

    let isDepotTransferExit = -1;
    if (req.query.is_depot_transfer_exit) {
      isDepotTransferExit = Number(req.query.is_depot_transfer_exit);
    }

    const receiptType = await determineReceiptType(documentUuid, isDepotTransferExit);

    let renderer;

    switch (receiptType) {
    case Stock.flux.FROM_PURCHASE:
      renderer = stockEntryPurchaseReceipt;
      break;

    case Stock.flux.FROM_OTHER_DEPOT:
      renderer = stockEntryDepotReceipt;
      break;

    case Stock.flux.FROM_ADJUSTMENT:
    case Stock.flux.TO_ADJUSTMENT:
    case Stock.flux.INVENTORY_ADJUSTMENT:
    case Stock.flux.INVENTORY_RESET:
      renderer = stockAdjustmentReceipt;
      break;

    case Stock.flux.FROM_INTEGRATION:
    case Stock.flux.TO_INTEGRATION:
      renderer = stockEntryIntegrationReceipt;
      break;

    case Stock.flux.TO_PATIENT:
      renderer = stockExitPatientReceipt;
      break;

    case Stock.flux.TO_OTHER_DEPOT:
      renderer = stockExitDepotReceipt;
      break;

    case Stock.flux.TO_SERVICE:
      renderer = stockExitServiceReceipt;
      break;

    case Stock.flux.TO_LOSS:
      renderer = stockExitLossReceipt;
      break;

    case Stock.flux.FROM_DONATION:
      renderer = stockEntryDonationReceipt;
      break;

    case Stock.flux.AGGREGATE_CONSUMPTION:
      renderer = stockExitAggregateConsumptionReceipt;
      break;

    default:
      throw new BadRequest('Could not determine stock receipt.');
    }

    // render the receipt and send it back to the client
    const { headers, report } = await renderer(documentUuid, req.session, req.query);
    res.set(headers).send(report);
  } catch (e) {
    next(e);
  }
}

exports.renderStockReceipt = renderStockReceipt;

// expose to the api
exports.stockAvgMedCostsPerPatientReport = stockAvgMedCostsPerPatientReport;
exports.stockExitReport = stockExitReport;
exports.stockEntryReport = stockEntryReport;
exports.expirationReport = expirationReport;
exports.stockLotsReport = stockLotsReport;
exports.stockMovementsReport = stockMovementsReport;
exports.stockInlineMovementsReport = stockInlineMovementsReport;
exports.stockInventoriesReport = stockInventoriesReport;
exports.stockSheetReport = stockSheetReport;
exports.stockAggregatedConsumptionReport = stockAggregatedConsumptionReport;
exports.stockAssignReport = stockAssignReport;
exports.satisfactionRateReport = satisfactionRateReport;
exports.satisfactionRates = satisfactionRates;

exports.stockValue = stockValue.document;
exports.stockValueReporting = stockValue.reporting;

exports.stockAssignmentReceipt = stockAssignmentReceipt;
exports.stockRequisitionReceipt = stockRequisitionReceipt;

exports.purchaseOrderAnalysis = require('./purchase_order_analysis');
exports.purchasePrices = require('./purchase_prices');

exports.lotBarcodeReceipt = lotBarcodeReceipt;
exports.lostStockReport = lostStockReport;
exports.stockAdjustmentReceipt = stockAdjustmentReceipt;
exports.stockExitAggregateConsumptionReceipt = stockExitAggregateConsumptionReceipt;

exports.monthlyConsumption = require('./stock/monthly_consumption');
exports.rumer = require('./stock/rumer');
exports.rumerApi = require('../api/rumer');
