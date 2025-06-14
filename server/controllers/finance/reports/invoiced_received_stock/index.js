const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');
const Patients = require('../../../medical/patients');

const TEMPLATE = './server/controllers/finance/reports/invoiced_received_stock/report.handlebars';

// expose to the API
exports.report = report;

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'invoiced_received_stock',
  filename : 'REPORT.COMPARE_INVOICED_RECEIVED.TITLE',
  orientation : 'landscape',
};

/**
 * @function report
 *
 * @description
 * This report makes it possible to attach the items billed to a patient on
 * the articulated items consumed or distributed to the Patient.
 */
async function report(req, res, next) {
  try {
    const { patientUuid } = req.query;
    const dateFrom = new Date(req.query.dateFrom);
    const dateTo = new Date(req.query.dateTo);

    const data = { period : { dateFrom, dateTo } };

    const sqlInvoice = `
      SELECT iv.uuid, map.text, iv.date
      FROM invoice AS iv
      JOIN debtor AS d ON d.uuid = iv.debtor_uuid
      JOIN patient AS p ON p.debtor_uuid = d.uuid
      JOIN document_map AS map ON map.uuid = iv.uuid
      WHERE p.uuid = ? AND (DATE(iv.date) >= DATE(?) AND DATE(iv.date) <= DATE(?))
      ORDER BY iv.date DESC
    `;

    const sqlInvoicedDistributed = `
      SELECT aggr.reference, BUID(aggr.inventory_uuid) AS inventory_uuid, aggr.inventory_text,
      SUM(aggr.quantity) AS quantity_invoiced, aggr.price_invoiced,
      BUID(aggr.invoice_uuid) AS invoice_uuid, aggr.invoice_date,
      SUM(aggr.quantity_distributed) AS quantity_distributed, SUM(aggr.cost_distributed) AS cost_distributed
      FROM (
        SELECT map.text AS reference, inv.uuid AS inventory_uuid, inv.text AS inventory_text, item.quantity,
          item.inventory_price AS price_invoiced,
          iv.uuid AS invoice_uuid, iv.date AS invoice_date,
          0 AS quantity_distributed,
          0 AS cost_distributed
        FROM invoice_item AS item
        JOIN inventory AS inv ON inv.uuid = item.inventory_uuid
        JOIN invoice AS iv ON iv.uuid = item.invoice_uuid
        JOIN document_map AS map ON map.uuid = iv.uuid
        JOIN patient AS p ON p.debtor_uuid = iv.debtor_uuid
        WHERE p.uuid = ? AND (DATE(iv.date) >= DATE(?) AND DATE(iv.date) <= DATE(?))
        AND inv.consumable = 1
      UNION ALL
        SELECT map.text AS reference, inv.uuid AS inventory_uuid, inv.text AS inventory_text,
        0 AS quantity, 0 AS price_invoiced, sm.invoice_uuid, sm.date,
        SUM(sm.quantity) AS quantity_distributed, sm.unit_cost AS cost_distributed
        FROM stock_movement AS sm
        JOIN patient AS p ON p.uuid = sm.entity_uuid
        JOIN lot AS l ON l.uuid = sm.lot_uuid
        JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
        JOIN invoice AS iv ON iv.uuid = sm.invoice_uuid
        JOIN document_map AS map ON map.uuid = iv.uuid
        WHERE sm.invoice_uuid IS NOT NULL AND
        p.uuid = ? AND (DATE(sm.date) >= DATE(?) AND DATE(sm.date) <= DATE(?))
        AND sm.is_exit = 1
        GROUP BY inv.uuid, iv.uuid
      ) AS aggr
      GROUP BY aggr.inventory_uuid, aggr.invoice_uuid
      ORDER BY aggr.inventory_text ASC
    `;

    const sqlNoInvoiceAttributionAggregat = `
      SELECT DISTINCT(mov.document_uuid) AS document_uuid, map.text AS document, mov.date
      FROM patient AS p
        JOIN stock_movement AS mov ON mov.entity_uuid = p.uuid
        JOIN document_map AS map ON map.uuid = mov.document_uuid
      WHERE p.uuid = ? AND (DATE(mov.date) >= DATE(?) AND DATE(mov.date) <= DATE(?)) AND mov.invoice_uuid IS NULL
      ORDER BY mov.date DESC;
    `;

    const sqlNoInvoiceAttribution = `
      SELECT
        BUID(p.uuid) AS patientUuid, mov.document_uuid, mov.quantity, mov.unit_cost, map.text AS document,
        iv.text AS inventory_text, (mov.quantity * mov.unit_cost) AS total_cost, mov.date
      FROM patient AS p
        JOIN stock_movement AS mov ON mov.entity_uuid = p.uuid
        JOIN lot AS l ON l.uuid = mov.lot_uuid
        JOIN inventory AS iv ON iv.uuid = l.inventory_uuid
        JOIN document_map AS map ON map.uuid = mov.document_uuid
      WHERE p.uuid = ? AND (DATE(mov.date) >= DATE(?) AND DATE(mov.date) <= DATE(?))
        AND mov.is_exit = 1 AND mov.invoice_uuid IS NULL
      ORDER BY iv.text ASC;
    `;

    const query = ({ ...DEFAULT_PARAMS, ...req.query });

    const reporting = new ReportManager(TEMPLATE, req.session, query);
    const patientBinaryUuid = db.bid(patientUuid);

    const [
      patient, invoices, inventoriesInvoicedDistibuted, noInvoiceAttributionAggregat, noInvoiceAttribution,
    ] = await Promise.all([
      Patients.lookupPatient(patientUuid),
      db.exec(sqlInvoice, [patientBinaryUuid, dateFrom, dateTo]),
      db.exec(sqlInvoicedDistributed, [patientBinaryUuid, dateFrom, dateTo, patientBinaryUuid, dateFrom, dateTo]),
      db.exec(sqlNoInvoiceAttributionAggregat, [patientBinaryUuid, dateFrom, dateTo]),
      db.exec(sqlNoInvoiceAttribution, [patientBinaryUuid, dateFrom, dateTo]),
    ]);

    Object.assign(data, { patient });

    invoices.forEach(invoice => {
      invoice.inventories = [];
      let totalInvoice = 0;
      let totalDistribution = 0;

      inventoriesInvoicedDistibuted.forEach(inventory => {
        if (invoice.text === inventory.reference) {
          inventory.quantity_invoiced = inventory.quantity_invoiced || '';
          inventory.quantity_distributed = inventory.quantity_distributed || '';
          inventory.total_item_invoiced = inventory.quantity_invoiced * inventory.price_invoiced;
          inventory.total_item_distributed = inventory.quantity_distributed * inventory.cost_distributed;

          inventory.quantity_difference = inventory.quantity_invoiced - inventory.quantity_distributed;
          inventory.cost_difference = inventory.total_item_invoiced - inventory.total_item_distributed;

          totalInvoice += inventory.total_item_invoiced;
          totalDistribution += inventory.total_item_distributed;

          invoice.inventories.push(inventory);
        }

        invoice.total_invoice = totalInvoice;
        invoice.total_distribution = totalDistribution;
        invoice.difference = totalInvoice - totalDistribution;
      });

      invoice.emptyInvoice = (invoice.inventories.length === 0);
    });

    noInvoiceAttributionAggregat.forEach(movement => {
      movement.inventories = [];
      movement.total_movement = 0;
      noInvoiceAttribution.forEach(inventory => {
        if (movement.document === inventory.document) {
          movement.inventories.push(inventory);
          movement.total_movement += inventory.total_cost;
        }
      });
    });

    data.invoices = invoices.filter(item => !item.emptyInvoice);

    data.noInvoiceAttributionAggregat = noInvoiceAttributionAggregat;
    data.checkNoInvoiceAttribution = (noInvoiceAttribution.length > 0);

    const result = await reporting.render(data);

    res.set(result.headers).send(result.report);
  } catch (err) {
    next(err);
  }
}
