/*
* Inventory Core Functions
*
* This file contains utility functions for common operations and common error
* handling.
*/
const _ = require('lodash');
const { uuid } = require('../../../lib/util');
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

// this should be a const in future ES versions
const errors = {
  MISSING_PARAMETERS : {
    httpStatus : 400,
    code       : 'ERR_MISSING_PARAMETERS',
    reason     : 'When using date ranges, you must provide both a start and end date.',
  },

  NO_INVENTORY_ITEMS : {
    httpStatus : 404,
    code       : 'ERR_NO_INVENTORY_ITEMS',
    reason     : 'No inventory items were found in the database query.',
  },

  NO_INVENTORY_ITEM : {
    httpStatus : 404,
    code       : 'ERR_NO_INVENTORY_ITEM',
    reason     : 'The inventory uuid requested was not found in the database.',
  },

  NO_STOCK : {
    httpStatus : 404,
    code       : 'ERR_NO_STOCK',
    reason     : 'No stock was found for the provided inventory uuid.',
  },
};

const inventoryColsMap = {
  code : 'FORM.LABELS.CODE',
  consumable : 'FORM.LABELS.CONSUMABLE',
  default_quantity : 'FORM.LABELS.DEFAULT_QUANTITY',
  group_uuid : 'FORM.LABELS.GROUP',
  inventoryGroup : 'FORM.LABELS.GROUP',
  label : 'FORM.LABELS.LABEL',
  tags : 'TAG.TAGS',
  text : 'FORM.LABELS.LABEL',
  note : 'FORM.INFO.NOTE',
  price : 'FORM.LABELS.UNIT_PRICE',
  sellable : 'INVENTORY.SELLABLE',
  type_id : 'FORM.LABELS.TYPE',
  inventoryType : 'FORM.LABELS.TYPE',
  unit_id : 'FORM.LABELS.UNIT',
  inventoryUnit : 'FORM.LABELS.UNIT',
  unit_volume : 'FORM.LABELS.VOLUME',
  unit_weight : 'FORM.LABELS.WEIGHT',
};

exports.getIds = getIds;
exports.getItemsMetadata = getItemsMetadata;
exports.getItemsMetadataById = getItemsMetadataById;
exports.createItemsMetadata = createItemsMetadata;
exports.updateItemsMetadata = updateItemsMetadata;
exports.errors = errors;
exports.errorHandler = errorHandler;
exports.remove = remove;
exports.inventoryLog = inventoryLog;
exports.inventoryColsMap = inventoryColsMap;

/**
* Create inventory metadata in the database
*
* @function createItemsMetadata
* @return {Promise} Returns a database query promise
*/
async function createItemsMetadata(record, session) {
  let tags;

  const recordCopy = _.clone(record);
  const recordUuid = record.uuid || uuid();

  record.enterprise_id = session.enterprise.id;
  record.uuid = db.bid(recordUuid);
  record.group_uuid = db.bid(record.group_uuid);

  const sql = 'INSERT INTO inventory SET ?;';
  const inventoryLogSql = 'INSERT INTO inventory_log SET ?;';

  const current = _.extend({}, { action : 'CREATION' }, recordCopy, await loadGroupAndType(record));
  const transaction = db.transaction();

  if (record.tags) {
    tags = _.clone(record.tags);
    delete record.tags;
  }

  transaction.addQuery(sql, [record]);

  if (tags && tags.length) {
    tags.forEach(t => {
      const binaryTagUuid = db.bid(t.uuid);
      const queryAddTags = 'INSERT INTO inventory_tag(inventory_uuid, tag_uuid) VALUES (?, ?);';
      transaction.addQuery(queryAddTags, [db.bid(recordUuid), binaryTagUuid]);
    });
  }

  transaction.addQuery(inventoryLogSql, {
    uuid : db.uuid(),
    inventory_uuid : db.bid(recordUuid),
    text : JSON.stringify({ action : 'CREATION', current, last : {} }),
    user_id : session.user.id,
  });

  /*
   * return a promise which can contains result or error which is caught
   * in the main controller (inventory.js)
  */
  return transaction.execute().then(() => recordUuid);
}

async function loadGroupAndType(record) {
  const data = {};
  if (record.type_id) {
    data.inventoryType = await db.one(`SELECT text from inventory_type where id =?`, record.type_id);
  }

  if (record.group_uuid) {
    data.inventoryGroup = await db.one(`SELECT name from inventory_group where uuid =?`, record.group_uuid);
  }

  if (record.unit_id) {
    data.inventoryUnit = await db.one(`SELECT text from inventory_unit where id =?`, record.unit_id);
  }

  return data;
}

/**
* Update inventory metadata in the database
*
* @function updateItemsMetadata
* @return {Promise} Returns a database query promise
*/
async function updateItemsMetadata(record, identifier, session) {
  let tags;
  // remove the uuid if it exists
  delete record.uuid;
  record.updated_by = session.user.id;
  const recordCopy = _.clone(record);
  if (record.group_uuid) {
    record.group_uuid = db.bid(record.group_uuid);
  }

  const sql = 'UPDATE inventory SET ? WHERE uuid = ?;';
  // if there is no property to update this query won't work

  if (_.isEmpty(record)) { // there is no change, but user has submitted
    return getItemsMetadataById(identifier);
  }

  if (record.tags) {
    tags = _.clone(record.tags);
    delete record.tags;
  }

  const inventoryLogSql = 'INSERT INTO inventory_log SET ?';
  const transaction = db.transaction();

  // @lastInfo inventory informations before update
  if (!_.isEmpty(record)) {
    transaction.addQuery(sql, [record, db.bid(identifier)]);
  }

  if (tags) {
    const inventoryUuid = db.bid(identifier);
    const queryClearPreviousTags = 'DELETE FROM inventory_tag WHERE inventory_uuid = ?';
    transaction.addQuery(queryClearPreviousTags, [inventoryUuid]);
    if (tags.length) {
      tags.forEach(t => {
        const binaryTagUuid = db.bid(t.uuid);
        const queryAddTags = 'INSERT INTO inventory_tag(inventory_uuid, tag_uuid) VALUES (?, ?);';
        transaction.addQuery(queryAddTags, [inventoryUuid, binaryTagUuid]);
      });
    }
  }

  // write into inventory log all changes
  if (!_.isEmpty(record) || typeof tags !== 'undefined') {
    const lastInfo = await getItemsMetadataById(identifier);
    const othersKeys = await loadGroupAndType(record);
    const current = _.extend({}, recordCopy, othersKeys);

    transaction.addQuery(inventoryLogSql, {
      uuid : db.uuid(),
      inventory_uuid : db.bid(identifier),
      text : JSON.stringify({ action : 'UPDATE', last : lastInfo, current }),
      user_id : session.user.id,
    });
  }

  /*
   * return a promise which can contains result or error which is caught
   * in the main controller (inventory.js)
  */

  return transaction.execute().then(() => getItemsMetadataById(identifier));
}

/**
* Find all inventory UUIDs in the database.
*
* @function getIds
* @return {Promise} Returns a database query promise
*/
function getIds() {
  // TODO - should we be filtering on enterprise id in these queries?
  const sql = 'SELECT i.uuid FROM inventory AS i;';
  return db.exec(sql);
}

/**
* This function finds inventory metadata for all recorded inventory items.  The
* result is a JSON with inventory stock, type, and unit information.
*
* @function getItemsMetadata
* @return {Promise} Returns a database query promise
*/
async function getItemsMetadata(params) {
  db.convert(params, ['inventory_uuids', 'tags', 'uuid', 'group_uuid']);

  const usePreviousPrice = params.use_previous_price && parseInt(params.use_previous_price, 10);
  delete params.usePreviousPrice;

  if (params.importance === '' || params.importance === null) {
    params.find_null_importance = true;
    delete params.importance;
  }

  const filters = new FilterParser(params, { tableAlias : 'inventory', autoParseStatements : false });
  const previousPriceQuery = `IFNULL(
    (SELECT pi.unit_price /
            (SELECT e.rate FROM exchange_rate AS e
             WHERE e.enterprise_id = inventory.enterprise_id
               AND e.currency_id = p.currency_id
               AND e.date <= date
             ORDER BY e.date DESC LIMIT 1)
     FROM purchase_item pi JOIN purchase p ON pi.purchase_uuid = p.uuid
     WHERE pi.inventory_uuid = inventory.uuid ORDER BY p.date DESC LIMIT 1)
  , inventory.price) AS price`;

  const sql = `
   SELECT BUID(inventory.uuid) as uuid, inventory.code, inventory.text AS label,
      IF(ISNULL(iu.token), iu.abbr, CONCAT("INVENTORY.UNITS.",iu.token,".ABBR")) AS unit_abbr,
      IF(ISNULL(iu.token), iu.text, CONCAT("INVENTORY.UNITS.",iu.token,".TEXT")) AS unit_type,
      it.text AS type, ig.name AS groupName, BUID(ig.uuid) AS group_uuid, ig.unique_item,
      inventory.consumable,inventory.locked, inventory.stock_min,
      inventory.stock_max, inventory.created_at AS timestamp, inventory.type_id, inventory.unit_id,
      inventory.note,  inventory.unit_weight, inventory.unit_volume, inventory.is_asset,
      inventory.manufacturer_brand, inventory.manufacturer_model, inventory.is_count_per_container,
      ig.sales_account, ig.stock_account, inventory.sellable,
      inventory.note, inventory.unit_weight, inventory.unit_volume, ig.sales_account, ig.stock_account,
      ig.cogs_account, inventory.default_quantity, ig.tracking_consumption, ig.tracking_expiration,
      inventory.importance, inventory.updated_at,  u.display_name AS last_user_update,
      GROUP_CONCAT(BUID(t.uuid), ';', t.name, ';', t.color ORDER BY t.name) AS tag_details,
      ${usePreviousPrice ? previousPriceQuery : 'inventory.price'}
    FROM inventory JOIN inventory_type AS it
    JOIN inventory_unit AS iu JOIN inventory_group AS ig ON
      inventory.type_id = it.id AND inventory.group_uuid = ig.uuid AND inventory.unit_id = iu.id
    LEFT JOIN inventory_tag itag ON itag.inventory_uuid = inventory.uuid
    LEFT JOIN user u ON u.id = inventory.updated_by
    LEFT JOIN tags t ON t.uuid = itag.tag_uuid`;

  // Note: The two 'LEFT JOINS' at the end of the query above are not normally
  //       necessary but are needed when the user searches by tags.

  filters.fullText('text', 'text', 'inventory');

  filters.equals('uuid');
  filters.equals('group_uuid');
  filters.equals('unit_id');
  filters.equals('type_id');
  filters.equals('code');
  filters.equals('consumable');
  filters.equals('price');
  filters.equals('locked');
  filters.equals('label');
  filters.equals('sellable');
  filters.equals('note');
  filters.equals('importance');
  filters.equals('is_asset');
  filters.equals('updated_by');
  filters.dateFrom('updated_at_from', 'updated_at');
  filters.dateTo('updated_at_to', 'updated_at');
  filters.fullText('reference_number');
  filters.equals('manufacturer_brand');
  filters.equals('manufacturer_model');
  filters.custom('tags', 't.uuid IN (?)', [params.tags]);
  filters.custom('find_null_importance', 'inventory.importance IS NULL');
  filters.custom('inventory_uuids', 'inventory.uuid IN (?)', params.inventory_uuids);
  filters.equals('is_count_per_container');

  // Handle requests for either consumables or assets
  if ('consumable_or_asset' in params && params.consumable_or_asset === '1') {
    filters.custom('consumable_or_asset', '(inventory.consumable = 1 OR inventory.is_asset = 1)');
  }

  filters.setOrder('ORDER BY inventory.code ASC');

  // The query above produces multiple rows for inventory items with more than one tag
  // (due to the LEFT JOIN).  Therefore use a GROUP BY to reduce to one and add
  // the tags via the GROUP_CONCAT above.
  filters.setGroup('GROUP BY inventory.uuid');

  let response;
  let responsePaging;

  if (params.paging) {
    const FROM_INDEX = String(sql).lastIndexOf('FROM');
    const select = String(sql).substring(0, FROM_INDEX - 1);
    const tables = String(sql).substring(FROM_INDEX, sql.length);
    responsePaging = await db.paginateQuery(select, params, tables, filters);
  } else {
    const query = filters.applyQuery(sql);
    const parameters = filters.parameters();
    response = await db.exec(query, parameters);
  }

  // Decode the tags for each inventory item with tags
  const dataRows = params.paging ? responsePaging.rows : response;
  dataRows.forEach(inv => {
    if (inv.tag_details) {
      inv.tags = [];
      const rawTags = inv.tag_details.split('|');
      rawTags.forEach(rawTag => {
        const [tagUuid, name, color] = rawTag.split(';');
        inv.tags.push({ uuid : tagUuid, name, color });
      });
    } else {
      inv.tags = null;
    }
  });

  return params.paging ? { rows : dataRows, pager : responsePaging.pager } : dataRows;
}

// This function helps to delete an inventory
function remove(_uuid) {
  const removeInventory = `DELETE FROM inventory WHERE uuid = ?`;
  const removeInventoryTags = `DELETE FROM inventory_tag WHERE inventory_uuid = ?`;
  const tx = db.transaction();
  tx.addQuery(removeInventoryTags, [db.bid(_uuid)]);
  tx.addQuery(removeInventory, [db.bid(_uuid)]);
  return tx.execute();
}

/**
* This function finds inventory metadata for a particular inventory item.  The
* result is a JSON with inventory stock, type, and unit information.
*
* @function getItemMetadata
* @param {String} uuid The inventory item identifier
* @return {Promise} Returns a database query promise
*/
async function getItemsMetadataById(uid, query = {}) {
  const sql = `
    SELECT BUID(i.uuid) as uuid, i.code, i.text AS label, i.price, i.is_asset,
      IF(ISNULL(iu.token), iu.text, CONCAT("INVENTORY.UNITS.",iu.token,".TEXT")) AS unit_type,
      it.text AS type, ig.name AS groupName, BUID(ig.uuid) AS group_uuid,
      ig.unique_item, i.consumable, i.locked, i.stock_min, i.sellable,
      i.stock_max, i.created_at AS timestamp, i.type_id, i.unit_id, i.unit_weight, i.unit_volume,
      ig.sales_account, i.default_quantity, i.delay, i.purchase_interval, i.importance,
      i.last_purchase, i.num_purchase, i.manufacturer_brand, i.manufacturer_model,
      i.is_count_per_container, ig.tracking_consumption, ig.tracking_expiration
    FROM inventory AS i JOIN inventory_type AS it
      JOIN inventory_unit AS iu
      JOIN inventory_group AS ig ON i.type_id = it.id
        AND i.group_uuid = ig.uuid
        AND i.unit_id = iu.id
    WHERE i.uuid = ?
    GROUP BY i.uuid;`;

  const queryTags = `
    SELECT BUID(t.uuid) AS uuid, t.name, t.color
    FROM tags t
    JOIN inventory_tag it ON it.tag_uuid = t.uuid
    WHERE it.inventory_uuid = ?;
  `;

  const response = await db.one(sql, [db.bid(uid), uid, 'inventory']);

  if (!query.skipTags) {
    response.tags = await db.exec(queryTags, [db.bid(uid)]);
  }

  return response;
}

/**
* Configures and sends appropriate HTTP error codes and information for repeat
* error cases throughout the module.
*
* @function errorHandler
* @param error An error object
* @param req ExpressJS req object
* @param res ExpressJS res object
* @param next ExpressJS's next function
*/
function errorHandler(error, req, res, next) {
  if (error.httpStatus !== undefined) {
    res.status(error.httpStatus).json(error);
  } else {
    next(error);
  }
}

function inventoryLog(inventoryUuid) {
  const sql = `
    SELECT ivl.text, ivl.log_timestamp, user.display_name as userName
    FROM inventory_log ivl
    JOIN user on user.id = ivl.user_id
    WHERE ivl.inventory_uuid=?
    ORDER BY ivl.log_timestamp DESC
  `;
  return db.exec(sql, db.bid(inventoryUuid));
}
