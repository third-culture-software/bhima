/**
 * @overview CreditorGroups
 *
 * @description
 * This controller exposes an API to the client for reading and creditor_groups
 */
const { uuid } = require('../../lib/util');
const db = require('../../lib/db');
const BadRequest = require('../../lib/errors/BadRequest');

// GET /creditor_groups
function lookupCreditorGroup(Uuid) {
  const sql = `
    SELECT enterprise_id, BUID(uuid) as uuid, name, account_id, locked
    FROM creditor_group
    WHERE creditor_group.uuid = ?;
  `;

  return db.one(sql, [db.bid(Uuid)], Uuid, 'Creditor Group');
}

// Lists of Creditor Groups
async function list(req, res) {
  let sql = 'SELECT BUID(uuid) as uuid, name FROM creditor_group ;';

  if (req.query.detailed === '1') {
    sql = `
      SELECT creditor_group.enterprise_id, BUID(creditor_group.uuid) AS uuid, creditor_group.name,
        creditor_group.account_id, creditor_group.locked,
        COUNT(creditor.uuid) AS total_creditors, account.number
      FROM creditor_group
      JOIN account ON account.id = creditor_group.account_id
      LEFT JOIN creditor ON creditor.group_uuid = creditor_group.uuid
      GROUP BY creditor_group.uuid`;
  }

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /creditor_groups/:uuid
*
* Returns the detail of a single Creditor Group
*/
async function detail(req, res) {
  const record = await lookupCreditorGroup(req.params.uuid);
  res.status(200).json(record);
}

/**
* POST /creditor_groups
*
* Insert new records in the creditor_group table
*/
async function create(req, res) {
  const data = req.body;

  // provide UUID if the client has not specified
  const creditorGroupUuid = data.uuid || uuid();
  data.uuid = db.bid(creditorGroupUuid);
  data.enterprise_id = req.session.enterprise.id;

  const sql = 'INSERT INTO creditor_group SET ? ';

  await db.exec(sql, [data]);
  res.status(201).json({ uuid : creditorGroupUuid });
}

/**
* PUT /creditor_groups/:uuid
*
* Update a creditor group based on its uuid
*/
async function update(req, res) {
  const sql = 'UPDATE creditor_group SET ? WHERE uuid = ?;';

  const uid = db.bid(req.params.uuid);

  await db.exec(sql, [req.body, uid]);
  const record = await lookupCreditorGroup(req.params.uuid);
  res.status(200).json(record);
}

/**
* DELETE /creditor_groups/:uuid
*
* Delete an existing creditor group
*/
async function remove(req, res) {
  const sql = 'DELETE FROM creditor_group WHERE uuid = ?;';
  const uid = db.bid(req.params.uuid);
  const rows = await db.exec(sql, [uid]);
  if (!rows.affectedRows) {
    throw new BadRequest(
      `Cannot delete the creditor group with id ${req.params.uuid}`,
      'CREDITOR_GROUP.FAILURE_DELETE',
    );
  }
  res.sendStatus(203);
}

// get list of creditor group
exports.list = list;

// get details of a creditor group
exports.detail = detail;

// create a new creditor group
exports.create = create;

// update creditor group informations
exports.update = update;

// delete the group
exports.remove = remove;
