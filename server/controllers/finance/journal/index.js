/** The /journal HTTP API endpoint
 *
 * @module finance/journal/
 *
 * @description
 * This module is responsible for handling CRUD operations
 * against the `posting journal` table.
 *
 * @requires lodash
 * @requires lib/db
 * @requires lib/util
 * @requires lib/filter
 * @requires lib/errors/NotFound
 * @requires lib/errors/BadRequest
 */

const _ = require('lodash');
const { uuid } = require('../../../lib/util');

// module dependencies
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const NotFound = require('../../../lib/errors/NotFound');
const BadRequest = require('../../../lib/errors/BadRequest');

const identifiers = require('../../../config/identifiers');

const hrRecordToTableMap = {};
_.forEach(identifiers, v => {
  hrRecordToTableMap[v.key] = v.table;
});

// services
const FiscalService = require('../fiscal');
const VoucherService = require('../vouchers');

// expose to the api
exports.list = list;
exports.getTransaction = getTransaction;
exports.reverse = reverse;
exports.reverseTransaction = reverseTransaction;
exports.find = find;
exports.buildTransactionQuery = buildTransactionQuery;

exports.getTransactionEditHistory = getTransactionEditHistory;

exports.editTransaction = editTransaction;
exports.count = count;
exports.log = log;
exports.findJournalLog = findJournalLog;

async function log(req, res, next) {
  const options = req.query;
  const { query, parameters } = findJournalLog(options);
  try {
    const rows = await db.exec(query, parameters);
    const data = rows.map(item => {
      item.value = JSON.parse(item.value);
      return item;
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

function findJournalLog(options) {
  db.convert(options, ['record_uuid']);
  const filters = new FilterParser(options, { tableAlias : 'th' });

  // journal log
  const sql = `
    SELECT 
      BUID(th.uuid) AS uuid,
      BUID(th.record_uuid) AS record_uuid,
      th.timestamp AS timestamp,
      th.value AS value,
      th.action,
      u.display_name,
      dm.text as hrRecord
    FROM transaction_history th
    JOIN user u ON u.id = th.user_id
    LEFT JOIN document_map dm ON dm.uuid = th.record_uuid
  `;

  filters.fullText('description', 'value');
  filters.fullText('hrRecord', 'value');
  filters.fullText('trans_id', 'value');

  filters.equals('action');
  filters.equals('user_id');

  filters.dateFrom('custom_period_start', 'timestamp', 'th');
  filters.dateTo('custom_period_end', 'timestamp', 'th');

  filters.period('period', 'timestamp', 'th');
  filters.setOrder('ORDER BY th.timestamp DESC');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();
  return { query, parameters };
}

/**
 * Looks up a transaction by record_uuid.
 *
 * @param {String} record_uuid - the record uuid
 * @returns {Promise} object - a promise resolving to the part of transaction object.
 */
function lookupTransaction(recordUuid) {
  const options = {
    record_uuid : recordUuid,
    includeNonPosted : true,
  };

  return find(options)
    .then(result => {
      // if no records matching, throw a 404
      if (result.length === 0) {
        throw new NotFound(`Could not find a transaction with record_uuid: ${recordUuid}.`);
      }

      return result;
    });
}

// @TODO(sfount) find a more efficient way of combining multiple table sets than a union all on the final results
//               - new method should be proven as more efficient on large data sets before being accepted
//
// Current merge logic : subset 1 UNION ALL subset 2 ORDER
// 1. select all from the posting journal including all joins, conditions etc.
// 2. select all from the general ledger including all joins, conditions etc.
// 3. UNION ALL between both complete sets of data
// 4. Apply date order
function naiveTransactionSearch(options, includeNonPosted) {
  // hack to ensure only the correct amount of rows are returned - this should be improved
  // in the more efficient method of selection
  let limitCondition = '';
  if (options.limit) {
    limitCondition = ` LIMIT ${Number(options.limit)}`;
  }

  if (!includeNonPosted) {
    const query = buildTransactionQuery(_.cloneDeep(options), false);
    return db.exec(`(${query.sql}) ORDER BY trans_date DESC ${limitCondition}`, query.parameters);
  }

  // clone options as filter parsing process mutates object
  const posted = buildTransactionQuery(_.cloneDeep(options), true);
  const nonPosted = buildTransactionQuery(_.cloneDeep(options), false);

  const combinedParameters = posted.parameters.concat(nonPosted.parameters);

  return db.exec(
    `(${posted.sql}) UNION ALL (${nonPosted.sql}) ORDER BY trans_date DESC ${limitCondition}`,
    combinedParameters,
  );
}

// if posted ONLY return posted transactions
// if not posted ONLY return non-posted transactions
function buildTransactionQuery(options, posted) {
  db.convert(options, [
    'uuid', 'record_uuid', 'uuids', 'record_uuids', 'reference_uuid', 'entity_uuid', 'stockReference',
  ]);

  const filters = new FilterParser(options, { tableAlias : 'p' });

  const table = posted ? 'general_ledger' : 'posting_journal';

  // TODO(@jniles) - make this a toggle that we can turn on/off on the client.
  options.includeExchangeRate = true;
  const includeExchangeRate = options.includeExchangeRate
    ? ', 1 / GetExchangeRate(pro.enterprise_id, c.id, p.trans_date) AS rate'
    : '';

  const sql = `
    SELECT BUID(p.uuid) AS uuid, ${posted} as posted, p.project_id, p.fiscal_year_id, p.period_id,
      p.trans_id, p.trans_date, BUID(p.record_uuid) AS record_uuid,
      dm1.text AS hrRecord, p.description, p.account_id, p.debit, p.credit,
      p.debit_equiv, p.credit_equiv, p.currency_id, c.name AS currencyName,
      BUID(p.entity_uuid) AS entity_uuid, em.text AS hrEntity,
      BUID(p.reference_uuid) AS reference_uuid, dm2.text AS hrReference,
      p.comment, p.transaction_type_id, p.user_id, pro.abbr,
      pro.name AS project_name, tp.text AS transaction_type_text,
      a.number AS account_number, a.type_id AS account_type_id, a.label AS account_label,
      p.trans_id_reference_number, p.cost_center_id, cc.label as costCenterLabel, p.created_at,
      u.display_name ${includeExchangeRate}
    FROM ${table} p
      JOIN project pro ON pro.id = p.project_id
      JOIN account a ON a.id = p.account_id
      LEFT JOIN transaction_type tp ON tp.id = p.transaction_type_id
      JOIN user u ON u.id = p.user_id
      JOIN currency c ON c.id = p.currency_id
      LEFT JOIN cost_center cc ON cc.id = p.cost_center_id
      LEFT JOIN entity_map em ON em.uuid = p.entity_uuid
      LEFT JOIN document_map dm1 ON dm1.uuid = p.record_uuid
      LEFT JOIN document_map dm2 ON dm2.uuid = p.reference_uuid
  `;

  filters.period('period', 'trans_date');
  filters.dateFrom('custom_period_start', 'trans_date');
  filters.dateTo('custom_period_end', 'trans_date');
  filters.fullText('description');
  filters.fullText('comment');

  filters.equals('user_id');
  filters.equals('account_id');
  filters.equals('account_type_id', 'type_id', 'a');
  filters.equals('project_id');
  filters.equals('trans_id');
  filters.equals('record_uuid');
  filters.equals('reference_uuid');
  filters.equals('currency_id');

  if (options.cost_center_id > -1) {
    filters.equals('cost_center_id');
  } else {
    filters.custom('cost_center_id', 'p.cost_center_id IS NULL', 'p');
  }

  filters.equals('comment');
  filters.equals('hrEntity', 'text', 'em');
  filters.equals('hrRecord', 'text', 'dm1');
  filters.equals('hrReference', 'text', 'dm2');
  filters.equals('entity_uuid');
  filters.equals('stockReference', 'reference_uuid', 'p');
  filters.custom('currency_id', 'c.id=?');

  // null cost center for only expense accounts
  const nullCC = 'p.cost_center_id IS NULL AND (a.type_id = 5)';
  filters.custom('showOnlyNullCostCenter', nullCC, 'p');

  filters.custom('transaction_type_id', 'p.transaction_type_id IN (?)', options.transaction_type_id);
  filters.custom('uuids', 'p.uuid IN (?)', [options.uuids]);
  filters.custom('record_uuids', 'p.record_uuid IN (?)', [options.record_uuids]);
  filters.custom('accounts_id', 'p.account_id IN (?)', [options.accounts_id]);
  const { amount } = options;
  filters.custom(
    'amount', '(credit = ? OR debit = ? OR credit_equiv = ? OR debit_equiv = ?)',
    [amount, amount, amount, amount],
  );

  return {
    sql : filters.applyQuery(sql),
    parameters : filters.parameters(),
  };
}

/**
 * @function find
 *
 * @description
 * This function filters the posting journal by query parameters passed in via
 * the options object.  If no query parameters are provided, the method will
 * return all items in the posting journal
 *
 * includeNonPosted
 * includeAggregates
 */
function find(options) {
  if (options.includeNonPosted && Boolean(Number(options.includeNonPosted))) {
    delete options.includeNonPosted;
    return naiveTransactionSearch(options, true);
  }

  return naiveTransactionSearch(options, false);
}

function postProcessFullTransactions(rows, includeNonPosted) {
  // get a list of unique record uuids
  const records = rows
    .map(row => row.record_uuid)
    .filter((value, idx, arr) => arr.indexOf(value) === idx);

  return find({ record_uuids : records, includeNonPosted });
}

/**
 * @method list
 *
 * @description
 * This function simply uses the find() method to filter the posting journal and
 * (optionally) the general ledger.  If the "showFullTransactions" option is
 * passed to the query string, the entire transaction matching the filter
 * parameters will be shown.
 */
function list(req, res, next) {
  // cache this the "nonposted" query in case in case we need to look up the
  // full transaction records.
  const { includeNonPosted, showFullTransactions } = req.query;
  find(req.query)
    .then(journalResults => {
      const hasEmptyResults = journalResults.length === 0;

      const hasFullTransactions = showFullTransactions
        && Boolean(Number(showFullTransactions));

      // only do a second pass if we have data and have requested the full transaction
      // records
      if (!hasEmptyResults && hasFullTransactions) {
        return postProcessFullTransactions(journalResults, includeNonPosted);
      }

      return journalResults;
    })
    .then(rows => res.status(200).send(rows))
    .catch(next)
    
}

/**
 * GET /journal/:record_uuid
 * send back a set of lines which have the same record_uuid the which provided by the user
 */
function getTransaction(req, res, next) {
  lookupTransaction(req.params.record_uuid)
    .then(transaction => {
      res.status(200).json(transaction);
    })
    .catch(next)
    
}

// @TODO(sfount) move edit transaction code to separate server controller - split editing process
//               up into smaller self contained methods
function editTransaction(req, res, next) {
  const REMOVE_JOURNAL_ROW = 'DELETE FROM posting_journal WHERE uuid = ?;';
  const UPDATE_JOURNAL_ROW = 'UPDATE posting_journal SET ? WHERE uuid = ?;';
  const INSERT_JOURNAL_ROW = 'INSERT INTO posting_journal SET ?;';
  const UPDATE_TRANSACTION_HISTORY = 'INSERT INTO transaction_history SET ?;';
  const UPDATE_RECORD_EDITED_FLAG = 'UPDATE ?? SET edited = 1 WHERE uuid = ?;';

  const transaction = db.transaction();
  const recordUuid = req.params.record_uuid;

  const rowsChanged = req.body.changed;
  const rowsAdded = req.body.added;
  const rowsRemoved = req.body.removed;

  let _transactionToEdit;
  let _fiscalYear;
  let _recordTableToEdit;

  rowsRemoved.forEach(row => {

    const deletedTransactionHistory = {
      uuid : db.bid(uuid()),
      record_uuid : db.bid(row.uuid),
      user_id : req.session.user.id,
      action : 'deleted',
      value : JSON.stringify(row),
    };

    transaction.addQuery(UPDATE_TRANSACTION_HISTORY, deletedTransactionHistory);
    transaction.addQuery(REMOVE_JOURNAL_ROW, [db.bid(row.uuid)]);
  });

  // verify that this transaction is NOT in the general ledger already
  // @FIXME(sfount) this logic needs to be updated when allowing super user editing
  lookupTransaction(recordUuid)
    .then(transactionToEdit => {
      const [{ posted, hrRecord }] = transactionToEdit;
      const transactionId = transactionToEdit[0].trans_id;

      // bind the current transaction under edit as "transactionToEdit"
      _transactionToEdit = transactionToEdit;

      // _recordTableToEdit is now either voucher, invoice, or cash
      const [prefix] = hrRecord.split('.');
      _recordTableToEdit = hrRecordToTableMap[prefix];

      // check the source (posted vs. non-posted) of the first transaction row
      if (posted) {
        throw new BadRequest(
          `Posted transactions cannot be edited.  Transaction ${transactionId} is already posted.`,
          'POSTING_JOURNAL.ERRORS.TRANSACTION_ALREADY_POSTED',
        );
      }

      // make sure that the user tools cannot simply remove all rows without going through
      // the deletion API
      const allRowsRemoved = (rowsAdded.length === 0 && rowsRemoved.length >= transactionToEdit.length);
      const singleRow = ((rowsAdded.length - rowsRemoved.length) + transactionToEdit.length) === 1;
      if (allRowsRemoved || singleRow) {
        throw new BadRequest(
          `Transaction ${transactionId} has too few rows!  A valid transaction must contain at least two rows.`,
          'POSTING_JOURNAL.ERRORS.TRANSACTION_MUST_CONTAIN_ROWS',
        );
      }

      // retrieve the transaction date
      const transDate = getTransactionDate(rowsChanged, transactionToEdit);
      return FiscalService.lookupFiscalYearByDate(transDate);
    })
    .then(fiscalYear => {
      _fiscalYear = fiscalYear;

      if (fiscalYear.locked) {
        throw new BadRequest(
          `${fiscalYear.label} is closed and locked.  You cannot make transactions against it.`,
          'POSTING_JOURNAL.ERRORS.CLOSED_FISCAL_YEAR',
        );
      }

      // continue with editing - transform requested additional columns
      return transformColumns(rowsAdded, true, _transactionToEdit, fiscalYear);
    })
    .then(result => {
      result.forEach(row => {
        db.convert(row, ['uuid', 'record_uuid', 'entity_uuid', 'reference_uuid']);
        transaction.addQuery(INSERT_JOURNAL_ROW, [row]);
      });

      return transformColumns(rowsChanged, false, _transactionToEdit, _fiscalYear);
    })
    .then(result => {
      _.each(result, (row, uid) => {
        db.convert(row, ['entity_uuid']);
        transaction.addQuery(UPDATE_JOURNAL_ROW, [row, db.bid(uid)]);
      });

      // record the transaction history once the transaction has been updated.
      const row = _transactionToEdit[0];
      const transactionHistory = {
        uuid : db.bid(uuid()),
        record_uuid : db.bid(row.record_uuid),
        user_id : req.session.user.id,
        value : JSON.stringify(row),
      };

      transaction
        .addQuery(UPDATE_RECORD_EDITED_FLAG, [_recordTableToEdit, db.bid(row.record_uuid)])
        .addQuery(UPDATE_TRANSACTION_HISTORY, [transactionHistory]);

      return transaction.execute();
    })
    .then(() => {
      // transaction changes written successfully - return latest version of transaction
      return lookupTransaction(recordUuid);
    })
    .then(updatedRows => {
      res.status(200).json(updatedRows);
    })
    .catch(next)
    

  // 1. make changes with update methods ('SET ?') etc.
  // 2. run changes through trial balance
  // 3. roll back transaction

  // edit transaction with uuid - uuid
}

// converts all valid posting journal editable columns into data representations
// returns valid errors for incorrect data
// @TODO Many requests are made vs. getting one look up table and using that - this can be greatly optimised
function transformColumns(rows, newRecord, transactionToEdit, setFiscalData) {
  const ACCOUNT_NUMBER_QUERY = 'SELECT id FROM account WHERE number = ?';
  const ENTITY_QUERY = 'SELECT uuid FROM entity_map WHERE text = ?';
  const REFERENCE_QUERY = 'SELECT uuid FROM document_map  WHERE text = ?';
  const EXCHANGE_RATE_QUERY = `
    SELECT ? * IF(enterprise.currency_id = ?, 1, GetExchangeRate(enterprise.id, ?, ?)) AS amount FROM enterprise
    JOIN project ON enterprise.id = project.enterprise_id WHERE project.id = ?;
  `;

  const EXCHANGE_RATE_REVERSE_QUERY = `
    SELECT ? * IF(enterprise.currency_id = ?, 1, (1 / GetExchangeRate(enterprise.id, ?, ?))) AS amount FROM enterprise
    JOIN project ON enterprise.id = project.enterprise_id WHERE project.id = ?;
  `;

  // these are global/shared properties of the current transaction
  // TODO(@jniles) - define these shared properties in an isomorphic way to share between
  // client and server.
  const projectId = transactionToEdit[0].project_id;
  const transactionDate = transactionToEdit[0].trans_date;
  const currencyId = transactionToEdit[0].currency_id;

  const databaseRequests = [];
  const databaseValues = [];
  const assignments = [];

  let promises = [];

  // this works on both the object provided from changes and the array from new
  // rows - that might be a hack
  _.each(rows, (row) => {
    // supports specific columns that can be edited on the client
    // accounts are required on new rows, business logic should be moved elsewhere
    if (newRecord && !row.account_number) {
      throw new BadRequest('Invalid accounts for journal rows', 'POSTING_JOURNAL.ERRORS.EDIT_INVALID_ACCOUNT');
    }

    if (row.account_number) {
      databaseRequests.push(ACCOUNT_NUMBER_QUERY);
      databaseValues.push([row.account_number]);
      assignments.push(result => {
        if (!result.length) {
          throw new BadRequest('Invalid accounts for journal rows', 'POSTING_JOURNAL.ERRORS.EDIT_INVALID_ACCOUNT');
        }

        _.extend(row, { account_id : result[0].id });
        return result;
      });

      delete row.account_number;
    }

    if (row.account_name) {
      delete row.account_name;
    }

    if (row.account_label) {
      delete row.account_label;
    }

    if (row.hrEntity) {
      // reverse barcode lookup entity
      databaseRequests.push(ENTITY_QUERY);
      databaseValues.push([row.hrEntity]);

      assignments.push(result => {
        if (!result.length) {
          throw new BadRequest('Invalid entity for journal rows', 'POSTING_JOURNAL.ERRORS.EDIT_INVALID_ENTITY');
        }

        _.extend(row, { entity_uuid : result[0].uuid });
        return result;
      });

      delete row.hrEntity;
    }

    if (row.hrReference) {
      // reverse barcode lookup entity
      databaseRequests.push(REFERENCE_QUERY);
      databaseValues.push([row.hrReference]);

      assignments.push(result => {
        if (!result.length) {
          throw new BadRequest('Invalid reference for journal rows', 'POSTING_JOURNAL.ERRORS.EDIT_INVALID_REFERENCE');
        }

        row.reference_uuid = result[0].uuid;
        return result;
      });
      delete row.hrReference;
    }

    // NOTE: To update the amounts, we need to have the enterprise_id, currency_id, and date.
    // These are attained from the old transaction (transactionToEdit) or the changed transaction.

    const isDebitEquivNonZero = row.debit_equiv !== 0;
    if (!_.isUndefined(row.debit_equiv)) {
      // if the date has been updated, use the new date - otherwise default to the old transaction date
      const transDate = new Date(row.trans_date ? row.trans_date : transactionDate);

      databaseRequests.push(EXCHANGE_RATE_QUERY);
      databaseValues.push([row.debit_equiv, currencyId, currencyId, transDate, projectId]);

      assignments.push(result => {
        const [{ amount }] = result;

        if (!amount && isDebitEquivNonZero) {
          throw new BadRequest(
            'Missing or corrupt exchange rate for rows',
            'POSTING_JOURNAL.ERRORS.MISSING_EXCHANGE_RATE',
          );
        }

        row.debit = amount;
      });
    }

    const isDebitNonZero = row.debit !== 0;
    if (!_.isUndefined(row.debit)) {
      // if the date has been updated, use the new date - otherwise default to the old transaction date
      const transDate = new Date(row.trans_date ? row.trans_date : transactionDate);

      databaseRequests.push(EXCHANGE_RATE_REVERSE_QUERY);
      databaseValues.push([row.debit, currencyId, currencyId, transDate, projectId]);

      assignments.push(result => {
        const [{ amount }] = result;

        if (!amount && isDebitNonZero) {
          throw new BadRequest(
            'Missing or corrupt exchange rate for rows',
            'POSTING_JOURNAL.ERRORS.MISSING_EXCHANGE_RATE',
          );
        }

        row.debit_equiv = amount;
      });
    }

    const isCreditEquivNonZero = row.credit_equiv !== 0;
    if (!_.isUndefined(row.credit_equiv)) {
      // if the date has been updated, use the new date - otherwise default to the old transaction date
      const transDate = new Date(row.trans_date ? row.trans_date : transactionDate);

      databaseRequests.push(EXCHANGE_RATE_QUERY);
      databaseValues.push([row.credit_equiv, currencyId, currencyId, transDate, projectId]);

      assignments.push(result => {
        const [{ amount }] = result;

        if (!amount && isCreditEquivNonZero) {
          throw new BadRequest(
            'Missing or corrupt exchange rate for rows',
            'POSTING_JOURNAL.ERRORS.MISSING_EXCHANGE_RATE',
          );
        }

        row.credit = amount;
      });
    }

    const isCreditNonZero = row.credit !== 0;
    if (!_.isUndefined(row.credit)) {
      // if the date has been updated, use the new date - otherwise default to the old transaction date
      const transDate = new Date(row.trans_date ? row.trans_date : transactionDate);

      databaseRequests.push(EXCHANGE_RATE_REVERSE_QUERY);
      databaseValues.push([row.credit, currencyId, currencyId, transDate, projectId]);

      assignments.push(result => {
        const [{ amount }] = result;

        if (!amount && isCreditNonZero) {
          throw new BadRequest(
            'Missing or corrupt exchange rate for rows',
            'POSTING_JOURNAL.ERRORS.MISSING_EXCHANGE_RATE',
          );
        }

        row.credit_equiv = amount;
      });
    }

    // ensure date strings are processed correctly
    // @TODO standardise formatting vs. lookup behaviour
    if (row.trans_date) {
      row.trans_date = new Date(row.trans_date);

      // Assign the fiscal year value and the period each time the trans_date change
      row.fiscal_year_id = setFiscalData.fiscal_year_id;
      row.period_id = setFiscalData.id;
    }
  });

  promises = databaseRequests.map(
    (request, index) => db.exec(request, databaseValues[index])
      .then(results => assignments[index](results)),
  );

  return Promise.all(promises)
    .then(() => rows);
}

/**
 * @method reverse
 *
 * @description
 * This is a generic wrapper for reversing any transaction in the posting
 * journal or general ledger.
 *
 * POST /journal/:uuid/reverse
 */
function reverse(req, res, next) {
  const recordUuid = db.bid(req.params.uuid);

  reverseTransaction(recordUuid, req.session.user.id, req.body.description)
    .then(reverseResult => VoucherService.lookupVoucher(reverseResult.uuid))
    .then(voucher => res.status(201).json({ uuid : voucher.uuid, voucher }))
    .catch(next);
}

/**
 * @method reverseTransaction
 *
 * @description
 * Reverses a transaction in the database by creating a reversing voucher.
 */
async function reverseTransaction(recordUuid, userId, reverseDescription) {
  const voucherUuid = uuid();
  const params = [
    recordUuid,
    userId,
    reverseDescription,
    db.bid(voucherUuid), // this is the reversal voucher uuid
  ];

  // Check to see if the record is already canceled.
  const CANCELLED_ID = 10;
  const query = `
    SELECT uuid FROM voucher
    WHERE voucher.type_id = ${CANCELLED_ID} AND voucher.reference_uuid = ?
  `;

  // create and execute a transaction if necessary
  const rows = await db.exec(query, [recordUuid]);

  if (rows.length > 0) {
    // transaction already cancelled
    throw new BadRequest(
      'The transaction has been already cancelled',
      'POSTING_JOURNAL.ERRORS.MULTIPLE_CANCELLING',
    );
  }

  // wrap call in transaction to reverse anything that needs to be reversed if
  // an error happens
  await db.transaction()
    .addQuery('CALL ReverseTransaction(?, ?, ?, ?, TRUE);', params)
    .execute();

  return { uuid : voucherUuid };
}

/**
 * @method count
 *
 *
 * GET /journal/count
 *
 * @description
 * Returns the number of transactions in the posting journal.
 *
 */
function count(req, res, next) {
  const sql = `
    SELECT COUNT(DISTINCT posting_journal.record_uuid) AS number_transactions
    FROM posting_journal;
  `;

  db.exec(sql)
    .then(rows => {
      res.status(200).send(rows);
    })
    .catch(next);
}

/**
 * @function getTransactionDate
 *
 * @description
 * This function computes the date of the transaction from the submitted data.
 * It will prefer changed rows over the underlying transaction, if the user changed the trans_date.
 */
function getTransactionDate(changedRows = {}, oldRows) {
  // for some reason, changedRows is an object while all others are arrays.
  // we must convert it to an array.
  const changes = _.map(changedRows, row => row);

  const rows = [...oldRows, ...changes];
  return rows
    .filter(row => row.trans_date)
    .map(row => row.trans_date)
    .pop();
}

/**
 * @function getTransactionEditHistory
 *
 * @description
 * A lightweight function to scan the transaction_history and check if
 * a transaction has previously been edited.  If so, it pulls out the user
 * that edited it and return that record to the client.
 */
function getTransactionEditHistory(req, res, next) {
  const sql = `
    SELECT u.display_name, timestamp FROM transaction_history
    JOIN user AS u ON u.id = transaction_history.user_id
    WHERE record_uuid = ?;
  `;

  db.exec(sql, [db.bid(req.params.uuid)])
    .then(record => res.status(200).json(record))
    .catch(next)
    
}
