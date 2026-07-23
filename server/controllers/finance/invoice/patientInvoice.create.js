/**
 * Patient Invoice - Create State
 * @module controllers/finance/patientInvoice
 *
 * This module is responsible for preparing a series of MySQL commands (a
 * transaction) for creating patient invoices, the transaction will be executed
 * by the API handler error and results will be propagated through to the
 * client.
 */
const db = require('../../../lib/db');
const util = require('../../../lib/util');

module.exports = createInvoice;

/**
 * POST /invoices
 *
 * The function is responsible for invoicing a patient and calculating the total
 * due on their invoice.  It will create a record in the `invoice` table.
 *
 * Up to three additional tables may be affected:
 *  1. `invoice_items`
 *  2. `invoice_invoicing_fee`
 *  3. `invoice_subsidy`
 *
 * The invoicing procedure of a patient's total invoice goes like this:
 *  1. First, the total sum of the invoice items are recorded as sent from the
 *  client.  The Patient Invoice module is allowed to edit the item costs as it
 *  sees fit, so we use the POSTed costs.
 *  2. Next, each invoicing fee is added to the invoice by writing records to
 *  the `invoice_invoicing_fee` table.  The cost of each invoicing fee is
 *  determined by multiplying the invoicing fee's value (as a percentage) to
 *  the total invoice cost.
 *  3. Finally, the subsidy for the bill is determined.  NOTE - as of #343, we
 *  are only allowing a single subsidy per invoice.  The array of subsidies is
 *  treated identically to the invoicing_fees, except that it subtracts from
 *  the total bill amount.
 * @param invoiceDetails
 * @param hasCreditorBalance
 * @param prepaymentDescription
 * @todo - change the API to pass in only an array of invoicingFee and subsidy
 * ids.
 */
function createInvoice(invoiceDetails, hasCreditorBalance, prepaymentDescription) {
  const transaction = db.transaction();
  const invoiceUuid = db.bid(invoiceDetails.uuid || util.uuid());

  db.convert(invoiceDetails, ['debtor_uuid', 'service_uuid']);

  const invoicingFees = processInvoicingFees(invoiceUuid, invoiceDetails.invoicingFees);
  const subsidies = processSubsidies(invoiceUuid, invoiceDetails.subsidies);
  const items = processInvoiceItems(invoiceUuid, invoiceDetails.items);

  const debtorUuid = invoiceDetails.debtor_uuid;
  const invoice = processInvoice(invoiceUuid, invoiceDetails);

  // 'stage' - make all data that will be required for writing an invoice available to the database procedures
  transaction.addQuery('CALL StageInvoice(?)', [invoice]);
  items.forEach(item => transaction.addQuery('CALL StageInvoiceItem(?)', [item]));
  invoicingFees.forEach(invoicingFee => transaction.addQuery('CALL StageInvoicingFee(?)', [invoicingFee]));
  subsidies.forEach(subsidy => transaction.addQuery('CALL StageSubsidy(?)', [subsidy]));

  // write and post invoice to the posting journal
  transaction.addQuery('CALL WriteInvoice(?)', [invoiceUuid]);
  transaction.addQuery('CALL PostInvoice(?)', [invoiceUuid]);

  // if there is a creditor balance, we will link the prepayments here.
  if (hasCreditorBalance) {
    transaction
      .addQuery('CALL LinkPrepaymentsToInvoice(?, ?, ?)', [invoiceUuid, debtorUuid, prepaymentDescription]);
  }

  return transaction;
}

/**
 *
 * @param invoiceUuid
 * @param invoice
 */
function processInvoice(invoiceUuid, invoice) {
  // ensure date is sanitised
  if (invoice.date) {
    invoice.date = new Date(invoice.date);
  }

  // convert debtor uuid if required
  if (invoice.debtor_uuid) {
    invoice.debtor_uuid = db.bid(invoice.debtor_uuid);
  }

  invoice.uuid = invoiceUuid;

  // cleanup details not directly tied to invoice
  delete invoice.items;
  delete invoice.invoicingFees;
  delete invoice.subsidies;
  delete invoice.reference;

  const keys = [
    'date', 'cost', 'description', 'service_uuid',
    'debtor_uuid', 'project_id', 'user_id', 'uuid',
  ];

  return keys.map(key => invoice[key]);
}

/**
 * @function processInvoicingFees
 * @description
 * Maps an array of invoicing fee ids into invoicing fee ids and invoice
 * UUID tuples.
 * @param {Buffer} invoiceUuid - the binary invoice UUID
 * @param {Array | undefined} subsidiesDetails - an array of invoicing fee ids
 *   if they exist.
 * @param invoicingFeeDetails
 * @returns {Array} - a possibly empty array invoicing fee ids and invoice UUID pairs.
 * @private
 */
function processInvoicingFees(invoiceUuid, invoicingFeeDetails) {
  const invoicingFees = invoicingFeeDetails || [];
  return invoicingFees.map(invoicingFeeId => [invoicingFeeId, invoiceUuid]);
}

/**
 * @function processSubsidies
 * @description
 * Maps an array of subsidy ids into subsidy id and invoice uuid tuples
 * @param {Buffer} invoiceUuid - the binary invoice uuid
 * @param {Array | undefined} subsidiesDetails - an array of subsidy ids if they
 *   exist.
 * @returns {Array} - a possibly empty array subsidy ids and invoice UUID pairs.
 * @private
 */
function processSubsidies(invoiceUuid, subsidiesDetails) {
  const subsidies = subsidiesDetails || [];
  return subsidies.map(subsidyId => [subsidyId, invoiceUuid]);
}

/**
 * Processes invoice items for database insertion.
 * @param {string} invoiceUuid 
 * @param {Array} items 
 * @returns {Array}
 */
function processInvoiceItems(invoiceUuid, items = []) {
  // make sure that invoice items have their uuids
  items.forEach((item) => {
    item.uuid = db.bid(item.uuid || util.uuid());
    item.invoice_uuid = invoiceUuid;

    // should every item have an inventory uuid?
    item.inventory_uuid = db.bid(item.inventory_uuid);

    // FIXME -- where is this supposed to have been defined?
    item.debit = 0;
  });

  // create a filter to align invoice item columns to the SQL columns
  const filter = util.take(
    'uuid', 'inventory_uuid', 'quantity', 'transaction_price',
    'inventory_price', 'debit', 'credit', 'invoice_uuid',
  );

  return items.map(filter);
}
