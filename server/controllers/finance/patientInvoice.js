/**
 * Patient Invoice API Controller
 *
 * @module controllers/finance/patientInvoice
 */

const debug = require('debug')('patientInvoice');
const { uuid } = require('../../lib/util');

const BadRequest = require('../../lib/errors/BadRequest');
const Debtors = require('./debtors');
const FilterParser = require('../../lib/filter');
const barcode = require('../../lib/barcode');
const createInvoice = require('./invoice/patientInvoice.create');
const consumableInvoice = require('./invoice/lookupConsumableInvoice');
const db = require('../../lib/db');
const identifiers = require('../../config/identifiers');
const shared = require('./shared');

const entityIdentifier = identifiers.INVOICE.key;
const CREDIT_NOTE_ID = 10;

/** Retrieves a list of all patient invoices (accepts ?q delimiter). */
/** Filter the patient invoice table by any column via query strings */
exports.read = read;

/** Retrieves details for a specific patient invoice. */
exports.detail = detail;

/** Write a new patient invoice record and attempt to post it to the journal. */
exports.create = create;

/** Expose lookup invoice for other controllers to use internally */
exports.lookupInvoice = lookupInvoice;

exports.find = find;

exports.safelyDeleteInvoice = safelyDeleteInvoice;

/** find the balance on an invoice due the particular debtor */
exports.balance = balance;

/** Expose lookup invoice credit note for other controllers to use internally */
exports.lookupInvoiceCreditNote = lookupInvoiceCreditNote;

/** get invoice details and its consumable inventories for a given patient */
exports.lookupConsumableInvoicePatient = consumableInvoice.lookupConsumableInvoicePatient;

/**
 * read
 *
 * Retrieves a read of all patient invoices in the database
 * Searches for a invoice by query parameters provided.
 */
function read(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
 * @method balance
 *
 * @description
 * This uses the lookupInvoice() and the invoiceBalances methods to find the
 * balance on a single invoice due to a debtor.
 *
 * @todo(jniles) write tests!
 */
function balance(req, res, next) {
  lookupInvoice(req.params.uuid)
    .then(invoice => {
      return Debtors.invoiceBalances(invoice.debtor_uuid, [req.params.uuid]);
    })
    .then(rows => {
      res.status(200).json(rows[0]);
    })
    .catch(next);

}

/**
 * @method lookupInvoice
 *
 * @description
 * Find an invoice by id in the database.
 *
 * @param {string} invoiceUuid - the uuid of the invoice in question
 */
async function lookupInvoice(invoiceUuid) {
  const buid = db.bid(invoiceUuid);

  const invoiceDetailQuery = `
    SELECT
      BUID(invoice.uuid) as uuid, CONCAT_WS('.', '${identifiers.INVOICE.key}',
      project.abbr, invoice.reference) AS reference, invoice.cost,
      invoice.description, BUID(invoice.debtor_uuid) AS debtor_uuid,
      patient.display_name AS debtor_name, BUID(patient.uuid) as patient_uuid,
      invoice.user_id, invoice.date, invoice.created_at, user.display_name, BUID(invoice.service_uuid) AS service_uuid,
      service.name AS serviceName, enterprise.currency_id
    FROM invoice
    LEFT JOIN patient ON patient.debtor_uuid = invoice.debtor_uuid
    JOIN service ON invoice.service_uuid = service.uuid
    JOIN project ON project.id = invoice.project_id
    JOIN enterprise ON enterprise.id = project.enterprise_id
    JOIN user ON user.id = invoice.user_id
    WHERE invoice.uuid = ?;
  `;

  const invoiceItemsQuery = `
    SELECT
      BUID(invoice_item.uuid) as uuid, invoice_item.quantity, invoice_item.inventory_price,
      invoice_item.transaction_price, inventory.code, inventory.text,
      inventory.consumable
    FROM invoice_item
    LEFT JOIN inventory ON invoice_item.inventory_uuid = inventory.uuid
    WHERE invoice_uuid = ?
    ORDER BY inventory.code;
  `;

  const invoiceBillingQuery = `
    SELECT
      invoice_invoicing_fee.value, invoicing_fee.label, invoicing_fee.value AS billing_value,
      SUM(invoice_item.quantity * invoice_item.transaction_price) AS invoice_cost
    FROM invoice_invoicing_fee
    JOIN invoicing_fee ON invoicing_fee.id = invoice_invoicing_fee.invoicing_fee_id
    JOIN invoice_item ON invoice_item.invoice_uuid = invoice_invoicing_fee.invoice_uuid
    WHERE invoice_invoicing_fee.invoice_uuid = ?
    GROUP BY invoicing_fee.id
  `;

  const invoiceSubsidyQuery = `
    SELECT invoice_subsidy.value, subsidy.label, subsidy.value AS subsidy_value
    FROM invoice_subsidy
    JOIN subsidy ON subsidy.id = invoice_subsidy.subsidy_id
    WHERE invoice_subsidy.invoice_uuid = ?;
  `;

  const invoice = await db.one(invoiceDetailQuery, [buid], invoiceUuid, 'invoice');

  const [items, billing, subsidy] = await Promise.all([
    db.exec(invoiceItemsQuery, [buid]),
    db.exec(invoiceBillingQuery, [buid]),
    db.exec(invoiceSubsidyQuery, [buid]),
  ]);

  // mixin the properties onto the invoice
  Object.assign(invoice, { items, billing, subsidy });

  // provide barcode string to be rendered by client/ receipts
  invoice.barcode = barcode.generate(entityIdentifier, invoice.uuid);

  return invoice;
}

/**
 * @todo Read the balance remaining on the debtors account given the invoice as an auxiliary step
 */
function detail(req, res, next) {
  // this assumes a value must be past for this route to initially match
  lookupInvoice(req.params.uuid)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

/**
  * @method checkAccountOverdraft
  *
  * @description
  * Ensures that the debtor's account doesn't have an overdraft limit that
  * would block the invoicing of this patient.
  */
async function checkAccountOverdraft(debtorUuid) {
  debug('Checking account overdraft for debtor: %s', debtorUuid);

  const { accountId, maxDebt } = await db.one(`
    SELECT debtor_group.account_id AS accountId, max_debt as maxDebt
    FROM debtor
      JOIN debtor_group ON debtor.group_uuid = debtor_group.uuid 
    WHERE debtor.uuid = ?;
  `, [db.bid(debtorUuid)]);

  // exit early if the maxDebt is 0, without doing the heavy account balance query.
  if (maxDebt <= 0) {
    debug('The max debt for the debtor group is 0.  No further account overdraft checks necessary.');
    return;
  }

  debug(`Debtor group has a maximum debt limit of ${maxDebt}. Querying the account balance..`);

  const sql = `
    SELECT t.account_id, IFNULL(SUM(t.debit), 0) AS debit, IFNULL(SUM(t.credit), 0) AS credit,
      IFNULL(t.balance, 0) AS accountBalance 
    FROM (
      SELECT gl.account_id, IFNULL(SUM(gl.debit), 0) AS debit,
        IFNULL(SUM(gl.credit), 0) AS credit,
        IFNULL((gl.debit - gl.credit), 0) AS balance
      FROM general_ledger AS gl
      WHERE gl.account_id = ? GROUP BY gl.account_id 
      UNION ALL
        SELECT pj.account_id, IFNULL(SUM(pj.debit), 0) AS debit,
        IFNULL(SUM(pj.credit), 0) AS credit, IFNULL((pj.debit - pj.credit), 0) AS balance
      FROM posting_journal AS pj
      WHERE pj.account_id = ? GROUP BY pj.account_id
    ) AS t GROUP BY t.account_id;
  `;

  const { accountBalance } = await db.one(sql, [accountId, accountId]);

  if (accountBalance >= maxDebt) {
    // eslint-disable-next-line
    debug(`Debtor account balance is ${accountBalance}, which is greater than the overdraft limit of ${maxDebt}.  Blocking the invoice transaction.`);
    // signal to the user that there is an issue if the account has been overdrafted.
    throw new BadRequest('DEBTOR_GROUP.ERRORS.OVERDRAFT_LIMIT_EXCEEDED');
  }

  // eslint-disable-next-line
  debug(`Debtor account balance is ${balance}, which is less than the overdraft limit of ${maxDebt}.  Proceeding with the invoice.`);
}

async function create(req, res, next) {
  try {
    const { invoice } = req.body;
    const { prepaymentDescription } = req.query;
    invoice.user_id = req.session.user.id;

    const hasPrepaymentSupport = req.session.enterprise.settings.enable_prepayments;

    const hasInvoiceItems = (invoice.items && invoice.items.length > 0);

    // detect missing items early and respond with an error
    if (!hasInvoiceItems) {
      throw new BadRequest(`An invoice must be submitted with invoice items.`);
    }

    // cache the uuid to avoid parsing later
    const invoiceUuid = invoice.uuid || uuid();
    invoice.uuid = invoiceUuid;

    const hasDebtorUuid = !!(invoice.debtor_uuid);
    if (!hasDebtorUuid) {
      throw new BadRequest(`An invoice must be submitted to a debtor.`);
    }

    // throws an error if the account is overdrafted.
    await checkAccountOverdraft(invoice.debtor_uuid);

    // check if the patient/debtor has a creditor balance with the enterprise.  If
    // so, we will use their caution balance to link to the invoice for payment.
    const [pBalance] = await Debtors.balance(invoice.debtor_uuid);
    const hasCreditorBalance = hasPrepaymentSupport && pBalance && ((pBalance.credit - pBalance.debit) > 0.01);
    const preparedTransaction = createInvoice(invoice, hasCreditorBalance, prepaymentDescription);
    await preparedTransaction.execute();

    res.status(201).json({ uuid : invoiceUuid });
  } catch (e) {
    next(e);
  }

}

function find(options) {
  // ensure expected options are parsed as binary
  db.convert(options, [
    'patientUuid', 'debtor_group_uuid', 'cash_uuid', 'debtor_uuid', 'inventory_uuid', 'uuid', 'service_uuid',
  ]);

  const filters = new FilterParser(options, { tableAlias : 'invoice' });

  // @FIXME Remove this with client side filter design
  delete options.patientNames;

  let debtorJoin = ``;
  const debtorKey = 'debtor_group_uuid';
  const hasDebtorKey = options[debtorKey];
  if (hasDebtorKey) {
    debtorJoin = `JOIN debtor d ON d.uuid = invoice.debtor_uuid`;
  }
  const sql = `
    SELECT BUID(invoice.uuid) as uuid, invoice.project_id, invoice.date,
      patient.display_name as patientName, invoice.cost, invoice.description,
      BUID(invoice.debtor_uuid) as debtor_uuid, dm.text AS reference,
      em.text AS patientReference, service.name as serviceName, proj.name AS project_name,
      user.display_name, invoice.user_id, invoice.reversed, invoice.edited, invoice.posted,
      invoice.created_at
    FROM invoice
    JOIN patient FORCE INDEX(debtor_uuid) ON invoice.debtor_uuid = patient.debtor_uuid
    ${debtorJoin}
    JOIN project AS proj ON proj.id = invoice.project_id
    JOIN entity_map AS em ON em.uuid = patient.uuid
    JOIN document_map AS dm ON dm.uuid = invoice.uuid
    JOIN service ON service.uuid = invoice.service_uuid
    JOIN user ON user.id = invoice.user_id
  `;

  filters.equals('cost');
  filters.equals('debtor_group_uuid', 'group_uuid', 'd');
  filters.equals('debtor_uuid');
  filters.equals('edited');
  filters.equals('patientUuid', 'uuid', 'patient');
  filters.equals('project_id');
  filters.equals('reversed');
  filters.equals('service_uuid');
  filters.equals('user_id');
  filters.equals('uuid');

  filters.fullText('description');

  filters.equals('reference', 'text', 'dm');
  filters.equals('patientReference', 'text', 'em');

  filters.custom(
    'cash_uuid',
    'invoice.uuid IN (SELECT cash_item.invoice_uuid FROM cash_item WHERE cash_item.cash_uuid = ?)',
  );

  filters.custom(
    'inventory_uuid',
    'invoice.uuid IN (SELECT invoice_item.invoice_uuid FROM invoice_item WHERE invoice_item.inventory_uuid = ?)',
  );

  filters.period('period', 'date');
  filters.dateFrom('custom_period_start', 'date');
  filters.dateTo('custom_period_end', 'date');

  // @TODO Support ordering query (reference support for limit)?
  filters.setOrder('ORDER BY invoice.date DESC, invoice.reference DESC');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

/**
 * @function lookupInvoiceCreditNote
 *
 * @description
 * CreditNote for an invoice
 */
function lookupInvoiceCreditNote(invoiceUuid) {
  const buid = db.bid(invoiceUuid);
  const sql = `
    SELECT BUID(v.uuid) AS uuid, v.date, dm.text AS reference,
      v.currency_id, v.amount, v.description, v.reference_uuid, u.display_name
    FROM voucher v
    JOIN document_map dm ON v.uuid = dm.uuid
    JOIN project p ON p.id = v.project_id
    JOIN user u ON u.id = v.user_id
    JOIN invoice i ON i.uuid = v.reference_uuid
    WHERE v.type_id = ${CREDIT_NOTE_ID} AND v.reference_uuid = ?`;

  return db.one(sql, [buid])
    .catch(() => {
      // db.one throw a critical error when there is not any record
      // and it must be handled
      return null;
    });
}

/**
 * @function safelyDeleteInvoice
 *
 * @description
 * This function deletes the invoice from the system.  It assumes that
 * checks have already been made for referencing transactions.
 */
function safelyDeleteInvoice(guid) {
  const DELETE_TRANSACTION = `
    DELETE FROM posting_journal WHERE record_uuid = ?;
  `;

  const DELETE_INVOICE = `
    DELETE FROM invoice WHERE uuid = ?;
  `;

  const DELETE_DOCUMENT_MAP = `
    DELETE FROM document_map WHERE uuid = ?;
  `;

  return shared.isRemovableTransaction(guid)
    .then(() => {
      const binaryUuid = db.bid(guid);
      const transaction = db.transaction();

      transaction
        .addQuery(DELETE_TRANSACTION, binaryUuid)
        .addQuery(DELETE_INVOICE, binaryUuid)
        .addQuery(DELETE_DOCUMENT_MAP, binaryUuid);

      return transaction.execute();
    });
}
