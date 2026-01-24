/**
 * Inventory Groups Controller
 * This controller is responsible for handling CRUD operations with inventory groups
 */
// const debug = require('debug')('bhima:inventory:groups');
const app = require('express').Router();
const db = require('../../../lib/db');
const { uuid } = require('../../../lib/util');
const { BadRequest } = require('../../../lib/errors');

/**
 * POST /inventory/groups
 *
 * Create a new inventory group
 */
app.post('/', async (req, res) => {
  const record = req.body;
  const recordUuid = record.uuid || uuid();
  record.uuid = db.bid(recordUuid);

  const sql = 'INSERT INTO inventory_group SET ?;';
  await db.exec(sql, [record]);

  res.status(201).json({ uuid : recordUuid });
});

/**
 * GET /inventory/groups
 * get the list of inventory groups
 */
app.get('/', async (req, res) => {
  const rows = await list(req.query.include_members);
  res.status(200).json(rows);
});

/**
 * GET /inventory/groups/:uuid
 * get the list of inventory groups
 */
app.get('/:uuid', async (req, res) => {
  const rows = await getGroups(req.params.uuid);
  res.status(200).json(rows);
});

/**
 * GET /inventory/groups/:uuid/count
 * count inventory in the group
 */
app.get('/:uuid/count', async (req, res) => {

  if (!req.params.uuid) {
    throw BadRequest('A group UUID is required to count inventory items.');
  }

  const id = db.bid(req.params.uuid);

  const sql = `
    SELECT COUNT(*) AS inventory_counted
    FROM inventory WHERE group_uuid = ?;
  `;

  const [row] = await db.exec(sql, [id]);
  res.status(200).json(row.inventory_counted);
});

/**
 * PUT /inventory/groups/:uuid
 *
 * Update an inventory group
 */
app.put('/:uuid', async (req, res) => {
  const uid = db.bid(req.params.uuid);
  const sql = 'UPDATE inventory_group SET ? WHERE uuid = ?;';
  await db.exec(sql, [req.body, uid]);
  const rows = await getGroups(req.params.uuid);
  res.status(201).json(rows);
});

/**
 * DELETE /inventory/groups/:uuid
 * delete an inventory group
 */
app.delete('/:uuid', async (req, res) => {
  const id = db.bid(req.params.uuid);
  const sql = 'DELETE FROM inventory_group WHERE uuid = ?;';
  await db.exec(sql, [id]);
  res.sendStatus(204);
});

/** list inventory group */
function list(includeMembers) {
  return (includeMembers) ? getGroupsMembers() : getGroups();
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

module.exports = app;
