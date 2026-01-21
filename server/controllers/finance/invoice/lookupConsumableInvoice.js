const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

/**
 * @function lookupConsumableInvoicePatient
 *
 * @description
 * This function returns an invoice details and all consumable inventories
 * related to this invoice.
 */
async function lookupConsumableInvoicePatient(req, res) {
  const params = req.query;
  const record = {};

  db.convert(params, [
    'patientUuid',
    'invoiceUuid',
  ]);

  const filters = new FilterParser(params);

  filters.equals('patientUuid', 'uuid', 'patient');
  filters.equals('invoiceReference', 'text', 'dm');
  filters.equals('invoiceUuid', 'uuid', 'invoice');

  const invoiceDetailQuery = `
      SELECT
        BUID(invoice.uuid) as uuid, dm.text AS reference,
        invoice.description, BUID(invoice.debtor_uuid) AS debtor_uuid,
        patient.display_name AS debtor_name, BUID(patient.uuid) as patient_uuid,
        invoice.user_id, invoice.date, user.display_name, invoice.service_uuid,
        service.name AS serviceName
      FROM invoice
      LEFT JOIN patient ON patient.debtor_uuid = invoice.debtor_uuid
      JOIN service ON invoice.service_uuid = service.uuid
      JOIN user ON user.id = invoice.user_id
      JOIN document_map AS dm ON dm.uuid = invoice.uuid`;

  const invoiceItemsQuery = `
      SELECT
        BUID(invoice_item.uuid) as uuid, invoice_item.quantity,
          invoice_item.inventory_price, invoice_item.transaction_price,
        BUID(inventory.uuid) as inventory_uuid, inventory.code, inventory.text,
          inventory.consumable, inventory_unit.text AS inventory_unit
      FROM invoice_item
      JOIN inventory ON invoice_item.inventory_uuid = inventory.uuid
      JOIN inventory_unit ON inventory_unit.id = inventory.unit_id
      WHERE invoice_uuid = ? AND inventory.consumable = 1`;

  const query = filters.applyQuery(invoiceDetailQuery);
  const queryParams = filters.parameters();

  const details = await db.exec(query, queryParams);
  if (!details.length) {
    res.status(200).json(null);
    return;
  }

  [record.details] = details;

  record.items = await db.exec(invoiceItemsQuery, [db.bid(record.details.uuid)]);
  res.status(200).json(record);
}

module.exports.lookupConsumableInvoicePatient = lookupConsumableInvoicePatient;
