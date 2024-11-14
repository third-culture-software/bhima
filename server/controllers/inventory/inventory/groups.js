/**
 * Inventory Groups Controller
 * This controller is responsible for handling CRUD operations with inventory groups
 */

// requirements
const db = require('../../../lib/db');
const { uuid } = require('../../../lib/util');

// expose module's methods
exports.list = list;
exports.details = details;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.countInventory = countInventory;

/** list inventory group */
function list(includeMembers) {
  return (includeMembers) ? getGroupsMembers() : getGroups();
}

/** details of inventory group */
function details(identifier) {
  return getGroups(identifier);
}

/** create new inventory group */
function create(record) {
  const recordUuid = record.uuid || uuid();
  record.uuid = db.bid(recordUuid);

  const sql = 'INSERT INTO inventory_group SET ?;';
  /*
   * return a promise which can contains result or error which is caught
   * in the main controller (inventory.js)
   */
  return db.exec(sql, [record])
    .then(() => recordUuid);
}

/** update an existing inventory group */
function update(record, identifier) {
  const uid = db.bid(identifier);

  const sql = 'UPDATE inventory_group SET ? WHERE uuid = ?;';
  /*
   * return a promise which can contains result or error which is caught
   * in the main controller (inventory.js)
   */
  return db.exec(sql, [record, uid])
    .then(() => getGroups(identifier));
}

/**
 * Get list of inventory groups
 * @param {string} uid the group uuid is optional
 */
function getGroups(uid) {
  const sql = `
    SELECT 
      BUID(uuid) AS uuid, code, name, sales_account,
      cogs_account, stock_account, unique_item,
      tracking_consumption, tracking_expiration, depreciation_rate
    FROM inventory_group
    ${uid ? 'WHERE uuid = ?' : ''};
  `;

  const id = (uid) ? db.bid(uid) : undefined;
  return id ? db.one(sql, [id]) : db.exec(sql);
}

/**
 * Get the inventory groups and the number of inventors that make up this group
 */
function getGroupsMembers() {
  const sql = `
    SELECT BUID(ig.uuid) AS uuid, ig.code, ig.name, ig.sales_account, ig.cogs_account, ig.unique_item,
      ig.stock_account, COUNT(i.uuid) AS inventory_counted, ig.tracking_consumption, ig.tracking_expiration,
      ig.depreciation_rate
    FROM inventory_group AS ig
    LEFT JOIN inventory AS i ON i.group_uuid = ig.uuid
    GROUP BY ig.uuid;
  `;

  return db.exec(sql);
}

/**
 * Count inventory in the group
 * @param {string} uid the group uuid
 */
function countInventory(uid) {
  const id = (uid) ? db.bid(uid) : undefined;

  const sql = `
    SELECT COUNT(*) AS inventory_counted
    FROM inventory WHERE group_uuid = ?;
  `;

  return db.exec(sql, [id]);
}

/** remove inventory group */
function remove(uid) {
  const id = db.bid(uid);
  const sql = 'DELETE FROM inventory_group WHERE uuid = ?;';
  return db.exec(sql, [id]);
}
