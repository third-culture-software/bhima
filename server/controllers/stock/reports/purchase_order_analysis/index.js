const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');
const Purchases = require('../../../finance/purchases');

const TEMPLATE = './server/controllers/stock/reports/purchase_order_analysis/report.handlebars';
exports.report = report;

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'inventoriesOrdered',
  filename : 'REPORT.PURCHASE_ORDER_ANALYSIS.TITLE',
  orientation : 'portrait',
};

/**
 * @function report
 *
 * @description
 * This function renders the purchase order analysis report.
 */
async function report(req, res) {
  let params = req.query;
  const data = {};

  params.shouldShowDetails = parseInt(params.shouldShowDetails, 10);
  if (params.shouldShowDetails) {
    data.displayDetails = params.shouldShowDetails;
  } else {
    data.hideDetails = !params.shouldShowDetails;
  }

  data.enterprise = req.session.enterprise;

  const statusDisplay = {
    waiting : {
      color : '#777777',
      icon : '...',
      text : 'FORM.LABELS.PENDING',
    },
    received : {
      color : '#5cb85c',
      icon : '✔',
      text : 'PURCHASES.STATUS.RECEIVED',
    },
    confirmed : {
      color : '#337AB7',
      icon : '-',
    },
    canceled : {
      color : '#d9534f',
      icon : 'X',
      text : 'FORM.LABELS.CANCELED',
    },
    exessive : {
      color : '#d9534f',
      icon : '▲',
      text : 'FORM.LABELS.RECEIVED_IN_EXCESS',
    },
    partial : {
      color : '#f0ad4e',
      icon : '▼',
      text : 'PURCHASES.STATUS.PARTIALLY_RECEIVED',
    },
  };

  params = { ...DEFAULT_PARAMS, ...params };
  const reporting = new ReportManager(TEMPLATE, req.session, params);

  // This request makes it possible to obtain the quantities of the ordered products
  const sqlInventoriesOrdered = `
      SELECT BUID(p.uuid) AS purchase_uuid, BUID(iv.uuid) AS inventory_uuid, iv.code,
        iv.text AS inventory_text, pi.quantity AS quantity_ordered, pi.package_size
      FROM purchase AS p
        JOIN purchase_item AS pi ON pi.purchase_uuid = p.uuid
        JOIN inventory AS iv ON iv.uuid = pi.inventory_uuid
      WHERE p.uuid = ?
      ORDER BY iv.text ASC;
    `;

  // This query is used to get the quantities in stock for a purchase order
  const sqlInventoriesInStock = `
      SELECT BUID(p.uuid) AS purchase_uuid, BUID(inv.uuid) AS inventory_uuid, inv.text AS inventoryText,
        l.label AS lotLabel, p.project_id, p.reference, p.user_id, SUM(sm.quantity) AS quantity_inStock,
        l.expiration_date, inv.code
      FROM purchase AS p
        JOIN stock_movement AS sm ON sm.entity_uuid = p.uuid
        JOIN lot l ON l.uuid = sm.lot_uuid
        JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
      WHERE p.uuid = ?
      GROUP BY inv.uuid
      ORDER BY inv.text ASC;
    `;

  // NOTE: Removed entry_date from previous query since it was removed from the lot table.
  //       If it is needed, it should be retrieved from stock_movements table.
  //       See getLots() query in server/controllers/stock/core.js for an example query.
  //       jmcameron 2021-03-26.

  // This request tracks the entries in stock of a purchase order, by date, by deposit but also by product
  const sqlInventoriesInStockDetailled = `
      SELECT BUID(p.uuid) AS purchase_uuid, BUID(iv.uuid) AS inventory_uuid, iv.text AS inventoryText,
        l.label AS lotLabel, p.project_id, p.reference, p.user_id, l.uuid AS lotUuid, l.quantity,
        l.expiration_date,
        (SELECT MIN(sm.date) FROM stock_movement sm WHERE sm.lot_uuid = l.uuid) AS entry_date,
        iv.code,
        d.text AS depotText, BUID(sm.uuid) AS stock_movement_uuid, dm1.text AS stock_movement_reference
      FROM purchase AS p
        JOIN stock_movement AS sm ON sm.entity_uuid = p.uuid
        JOIN lot AS l ON l.uuid = sm.lot_uuid
        JOIN inventory AS iv ON iv.uuid = l.inventory_uuid
        JOIN depot AS d ON d.uuid = sm.depot_uuid
        JOIN document_map AS dm1 ON dm1.uuid = sm.document_uuid
      WHERE p.uuid = ? AND sm.is_exit = 0 AND sm.flux_id = ?
      ORDER BY iv.text ASC, entry_date ASC
    `;

  const uidPurchase = db.bid(params.purchase_uuid);
  const PURCHASE_FLUX_ID = 1;

  const [
    [purchase], inventoriesOrdered, inventoriesInStock, inventoriesInStockDetailled,
  ] = await Promise.all([
    Purchases.find({ uuid : params.purchase_uuid }),
    db.exec(sqlInventoriesOrdered, uidPurchase),
    db.exec(sqlInventoriesInStock, uidPurchase),
    db.exec(sqlInventoriesInStockDetailled, [uidPurchase, PURCHASE_FLUX_ID]),
  ]);

  inventoriesOrdered.forEach(ordered => {
    // Initialization of the quantity received
    ordered.quantity_inStock = 0;
    ordered.quantity_difference = ordered.quantity_ordered;
    ordered.last_entry_date = null;

    inventoriesInStock.forEach(inStock => {
      if (ordered.inventory_uuid === inStock.inventory_uuid) {
        ordered.quantity_inStock += inStock.quantity_inStock;
        ordered.quantity_difference -= inStock.quantity_inStock;
        ordered.last_entry_date = inStock.entry_date;
      }
    });
  });

  inventoriesOrdered.forEach(ordered => {
    if (ordered.quantity_difference === ordered.quantity_ordered) {
      ordered.status = statusDisplay.waiting;
    } else if (ordered.quantity_difference < 0) {
      ordered.status = statusDisplay.exessive;
    } else if (ordered.quantity_difference === 0) {
      ordered.status = statusDisplay.received;
    } else if (ordered.quantity_difference > 0 && ordered.quantity_difference < ordered.quantity_ordered) {
      ordered.status = statusDisplay.partial;
    }

    // if the purchase order is canceled, it should display canceled for all
    // items
    if (purchase.status_id === 5) {
      ordered.status = statusDisplay.canceled;
    }

  });

  inventoriesOrdered.forEach(ordered => {
    ordered.detailled = [];
    inventoriesInStockDetailled.forEach(detailled => {
      if (ordered.inventory_uuid === detailled.inventory_uuid) {
        ordered.detailled.push(detailled);
      }
    });
  });

  data.inventoriesOrdered = inventoriesOrdered;

  data.purchase = purchase;

  if (data.purchase.status_id === 1) {
    data.purchase.statusDisplay = statusDisplay.waiting;
  } else if (data.purchase.status_id === 2) {
    data.purchase.statusDisplay = statusDisplay.confirmed;
  } if (data.purchase.status_id === 3) {
    data.purchase.statusDisplay = statusDisplay.received;
  } else if (data.purchase.status_id === 4) {
    data.purchase.statusDisplay = statusDisplay.partial;
  } else if (data.purchase.status_id === 5) {
    data.purchase.statusDisplay = statusDisplay.canceled;
  } else if (data.purchase.status_id === 6) {
    data.purchase.statusDisplay = statusDisplay.exessive;
  }

  const result = await reporting.render(data);
  res.set(result.headers).send(result.report);
}
