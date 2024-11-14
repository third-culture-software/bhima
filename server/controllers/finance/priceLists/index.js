/**
 * Price List Controller
 *
 * @module finance/priceList
 *
 * @desc Implements CRUD operations on the Price List entity.
 *
 * This module implements the following routes:
 * GET    /prices
 * GET    /prices/:uuid
 * POST   /prices
 * PUT    /prices/:uuid
 * DELETE /prices/:uuid
 */
const db = require('../../../lib/db');

const BadRequest = require('../../../lib/errors/BadRequest');
const util = require('../../../lib/util');
const csv = require('../../../lib/renderers/csv');
const ReportManager = require('../../../lib/ReportManager');

exports.lookup = lookup;
/**
 * Lists all price lists in the database
 *
 * GET /prices
 */
exports.list = function list(req, res, next) {
  lookup(req)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

};

function lookup(req) {
  let sql;

  if (req.query.detailed === '1') {
    sql = `
      SELECT BUID(pl.uuid) as uuid, pl.label, pl.created_at, pl.description,
        COUNT(pl_it.uuid) as itemsNumber, COUNT(pg.uuid) as subcribedGroupsNumber
      FROM price_list pl
      LEFT JOIN price_list_item pl_it ON pl_it.price_list_uuid = pl.uuid
      LEFT JOIN patient_group pg ON pg.price_list_uuid = pl.uuid

      WHERE pl.enterprise_id = ?
      GROUP BY pl.uuid
      ORDER BY pl.label;`;
  } else {
    sql = `
      SELECT BUID(uuid) as uuid, label
      FROM price_list
      WHERE enterprise_id = ?
      ORDER BY label;`;
  }
  return db.exec(sql, [req.session.enterprise.id]);
}
/**
 * @param {number} id
 * @desc Queries the price_list and price_list_item tables for a pricle list
 * with the given ID.
 *
 * @example
 * // lookup price list
 * .then(function (priceList) {
 *   res.status(200).json(priceList);
 * })
 * .catch(next)
 *
 *
 * @returns {Promise}
 */
function lookupPriceList(uid) {
  let priceList;
  let sql = `
    SELECT BUID(uuid) AS uuid, label, description, created_at, updated_at
    FROM price_list WHERE uuid = ?;`;

  return db.one(sql, [uid])
    .then((row) => {
      priceList = row;

      sql = `
        SELECT BUID(uuid) as uuid, BUID(inventory_uuid) as inventory_uuid, label, value, is_percentage, created_at
        FROM price_list_item WHERE price_list_uuid = ?;`;

      return db.exec(sql, [uid]);
    })
    .then((rows) => {
      priceList.items = rows;

      // return the price list object to the next promise callback
      return priceList;
    });
}

/**
 * Retrieve the details and items of a single price list.
 *
 * GET /prices/:uuid
 */
exports.details = function details(req, res, next) {
  const uid = db.bid(req.params.uuid);

  lookupPriceList(uid)
    .then((priceList) => {
      res.status(200).json(priceList);
    })
    .catch(next);

};

/**
 * Convert an array of price list item objects into an array of arrays for
 * easy database insertion
 *
 * @param {String} priceListUuid
 * @param {Array} items
 *
 * @example
 * var items = [{
 *   inventory_uuid : 'a11e6b7f-fbbb-432e-ac2a-5312a66dccf4',
 *   label : 'Aspirin 15% reduction',
 *   value : 15,
 *   is_percentage : true
 * }, {
 *   uuid : '274c51ae-efcc-4238-98c6-f402bfb39866',
 *   inventory_uuid : '81af634f-321a-40de-bc6f-ceb1167a9f65',
 *   label : 'Quinine $10 reduction',
 *   value : 10,
 *   is_percentage : false
 * }];
 *
 * var priceListUuid = '32b674a6-6aa3-4098-ac11-a4d3e21fc0ba';
 *
 * // format the items into an array of arrays for database insertion
 * items = formatPriceListItems(priceListUuid, items);
 *
 * // items is now:
 * [ [ '3be232f9-a4b9-4af6-984c-5d3f87d5c107',
 *     'a11e6b7f-fbbb-432e-ac2a-5312a66dccf4',
 *     '32b674a6-6aa3-4098-ac11-a4d3e21fc0ba',
 *     'Aspirin 15% reduction',
 *     15,
 *     true ],
 *   [ '274c51ae-efcc-4238-98c6-f402bfb39866',
 *     '81af634f-321a-40de-bc6f-ceb1167a9f65',
 *     '32b674a6-6aa3-4098-ac11-a4d3e21fc0ba',
 *     'Quinine $10 reduction',
 *     10,
 *     false ] ]
 *
 * @returns {Array} items
 */
function formatPriceListItems(priceListUuid, items) {
  // format the price list items into a format that can be easily inserted into
  // the database
  return items.map((item) => {
    //  prevent missing inventory_uuids from crashing the server
    const inventoryId = item.inventory_uuid ? db.bid(item.inventory_uuid) : null;

    return [
      db.bid(item.uuid || util.uuid()),
      inventoryId,
      priceListUuid,
      item.label,
      item.value,
      item.is_percentage,
    ];
  });
}

/**
 * Create a new price list entity, along with price list items.
 *
 * POST /prices
 */
exports.create = function create(req, res, next) {
  let items;
  const data = req.body.list;
  const trans = db.transaction();
  const priceListSql = `
    INSERT INTO price_list (uuid, label, description, enterprise_id)
    VALUES (?, ?, ?, ?);`;

  const priceListItemSql = `
    INSERT INTO price_list_item (uuid, inventory_uuid, price_list_uuid,
    label, value, is_percentage) VALUES ?;`;

  // generate a UUID if not provided
  const priceListUuid = data.uuid || util.uuid();
  data.uuid = db.bid(priceListUuid);
  // if the client didn't send price list items, do not create them.
  if (data.items) {
    items = formatPriceListItems(data.uuid, data.items);
  }

  // remove before database insertion
  delete data.items;

  // enqueue the queries to the transaction
  trans.addQuery(priceListSql, [
    data.uuid, data.label, data.description, req.session.enterprise.id,
  ]);

  // only enqueue the price list items if they exist
  if (items) { trans.addQuery(priceListItemSql, [items]); }

  trans.execute()
    .then(() => {
      // respond to the client with a 201 CREATED
      res.status(201).json({ uuid : priceListUuid });
    })
    .catch(next);

};

// add a new price list item
exports.createItem = function createItem(req, res, next) {
  const priceListCreateItemSql = `INSERT INTO price_list_item  SET ?`;
  const data = req.body;
  db.convert(data, ['inventory_uuid', 'price_list_uuid']);
  data.uuid = data.uuid ? db.bid(data.uuid) : db.uuid();

  db.exec(priceListCreateItemSql, data).then(() => {
    res.sendStatus(201);
  }).catch(next);

};

/**
 * @function downloadFilledTemplate
 *
 * @description
 * Dumps the items that are for sale to a CSV file for the user to fill out and
 * later import via the import route.
 */
exports.downloadFilledTemplate = async (req, res, next) => {
  try {
    const reportOptions = {
      csvKey : 'rows',
      suppressDefaultFormatting : true,
      suppressDefaultFiltering : true,
    };

    // currency symbol is included in the import so the user knows
    // the valuation of the currency
    const { currencySymbol } = req.session.enterprise;

    const options = { ...req.query, ...reportOptions, filename : 'PRICE_LIST.NEW_PRICE_LIST' };

    const report = new ReportManager('', req.session, options);
    const sql = 'SELECT BUID(uuid) as uuid, code, text, price FROM inventory WHERE sellable = 1 ORDER BY text, code';
    const rows = await db.exec(sql);
    const data = rows.map(row => {
      row.previous_price = row.price;
      row.price = '';
      row.currency = currencySymbol;
      return row;
    });

    const result = await report.render({ rows : data }, null, { csvKey : 'rows' });
    res.set(csv.headers).send(result.report);
  } catch (err) {
    next(err);
  }
};

/**
 * @function importItems
 *
 * @description
 * Imports the items to the database from the CSV file provided by the user.
 * The CSV file must have uuids for each inventory item, the label of the item,
 * and the accompanying price in a column labeled "price".
 */
exports.importItems = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      const errorDescription = 'Expected at least one file upload but did not receive any files.';
      throw new BadRequest(errorDescription, 'ERRORS.MISSING_UPLOAD_FILES');
    }

    db.convert(req.body, ['pricelist_uuid']);

    const filePath = req.files[0].path;

    const data = removeEmptyLines(await util.formatCsvToJson(filePath));

    if (!hasValidDataFormat(data)) {
      throw new BadRequest('The given file has a bad data format for stock', 'ERRORS.BAD_DATA_FORMAT');
    }

    const priceListUuid = db.bid(req.body.pricelist_uuid);
    const transaction = db.transaction();

    transaction

    // first, clear all old values from the price list
      .addQuery('DELETE FROM price_list_item WHERE price_list_uuid = ?', priceListUuid);

    const sql = `
      INSERT INTO price_list_item (uuid, inventory_uuid, price_list_uuid, label, value)
      VALUES (?, ?, ?, ?, ?)
    `;

    data.forEach(row => {
      transaction.addQuery(sql, [db.uuid(), db.bid(row.uuid), priceListUuid, row.text, row.price]);
    });

    await transaction.execute();
    res.sendStatus(200);
  } catch (ex) {
    next(ex);
  }

};

function removeEmptyLines(data) {
  return data.filter(row => (row.uuid && row.price));
}

function hasValidDataFormat(data) {
  return data.every(row => (row.uuid && row.price > 0));
}

exports.deleteItem = async function deleteItem(req, res, next) {
  const priceListDeleteItemSql = `DELETE FROM price_list_item  WHERE uuid = ?`;
  try {
    const itemUuid = db.bid(req.params.uuid);
    await db.exec(priceListDeleteItemSql, itemUuid);
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

/**
 * Updates a price list (and associated items) in the database.
 *
 * PUT /prices/:uuid
 */
exports.update = function update(req, res, next) {
  let items;
  const data = req.body.list;
  const priceListSql = 'UPDATE price_list SET ? WHERE uuid = ?;';

  const priceListDeleteItemSql = 'DELETE FROM price_list_item WHERE price_list_uuid = ?';

  const priceListCreateItemSql = `
    INSERT INTO price_list_item (uuid, inventory_uuid, price_list_uuid,
    label, value, is_percentage) VALUES ?;`;

  const trans = db.transaction();
  const uid = db.bid(req.params.uuid);

  // if the client didn't send price list items, do not create them.
  if (data.items) {
    items = formatPriceListItems(uid, data.items);
  }

  // remove non-updatable properties before queries
  delete data.uuid;
  delete data.items;

  // make sure the price list exists
  lookupPriceList(uid)
    .then(() => {
      // if we get here, it means the price list exists and we can perform an
      // update query on it. Since we are doing multiple operations at once,
      // wrap the queries in a DB transaction.
      if (!isEmptyObject(data)) {
        trans.addQuery(priceListSql, [data, uid]);
      }

      // only trigger price list item updates if the items have been sent back to
      // the server

      if (items) {
        trans.addQuery(priceListDeleteItemSql, [uid]);
        trans.addQuery(priceListCreateItemSql, [items]);
      }

      return trans.execute();
    })
    .then(() => {
      // send the full resource object back to the client via lookup function
      return lookupPriceList(uid);
    })
    .then((priceList) => {
      res.status(200).json(priceList);
    })
    .catch(next);

};

/**
 * Delete a price list (and associated items) in the database.
 *
 * DELETE /prices/:uuid
 */
exports.delete = function del(req, res, next) {
  const uid = db.bid(req.params.uuid);

  const sql = 'DELETE FROM price_list WHERE uuid = ?;';

  // ensure that the price list exists
  lookupPriceList(uid)
    .then(() => {
      return db.exec(sql, [uid]);
    })
    .then(() => {
    // respond with 204 'NO CONTENT'
      res.status(204).json();
    })
    .catch(next);

};

function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}
