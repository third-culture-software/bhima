/**
 * @overview
 * Supplier Controller
 *
 * @description
 * This controller exposes an API to the client for reading and writing supplier
 *
 * @requires lib/util
 * @requires lib/db
 */

const { uuid } = require('../../lib/util');
const db = require('../../lib/db');

function lookupSupplier(uid) {
  const sql = `
    SELECT BUID(supplier.uuid) as uuid, BUID(supplier.creditor_uuid) as creditor_uuid, supplier.display_name,
      supplier.address_1, supplier.address_2, supplier.email, supplier.fax, supplier.note,
      supplier.phone, supplier.international, supplier.locked,
      BUID(entity.uuid) AS contact_uuid,
      entity.display_name AS contact_name,
      entity.title AS contact_title,
      entity.phone AS contact_phone,
      entity.email AS contact_email,
      creditor.group_uuid AS creditor_group_uuid
    FROM supplier
    JOIN creditor ON creditor.uuid = supplier.creditor_uuid
    LEFT JOIN entity ON entity.uuid = supplier.contact_uuid
    WHERE supplier.uuid = ?;
  `;

  return db.one(sql, [db.bid(uid)], uid, 'supplier');
}

/**
 * @method list
 *
 * @description
 * This method lists all suppliers registered in the database.
 */
async function list(req, res) {
  let sql = `
    SELECT
      BUID(supplier.uuid) AS uuid, BUID(supplier.creditor_uuid) AS creditor_uuid, supplier.display_name,
      supplier.display_name, supplier.address_1, supplier.address_2, supplier.email, supplier.fax, supplier.note,
      supplier.phone, supplier.international, supplier.locked, BUID(creditor.group_uuid) AS creditor_group_uuid,
      BUID(entity.uuid) AS contact_uuid,
      entity.display_name AS contact_name,
      entity.title AS contact_title,
      entity.phone AS contact_phone,
      entity.email AS contact_email
    FROM supplier 
    JOIN creditor ON supplier.creditor_uuid = creditor.uuid
    LEFT JOIN entity ON entity.uuid = supplier.contact_uuid
    
  `;

  const locked = Number(req.query.locked);
  const params = [];

  if (!Number.isNaN(locked)) {
    sql += 'WHERE supplier.locked = ?;';
    params.push(locked);
  }

  const rows = await db.exec(sql, params);
  res.status(200).json(rows);
}

/**
 * @method detail
 *
 * @description
 * GET /suppliers/:uuid
 *
 * Returns the detail of a single Supplier
 */
async function detail(req, res) {
  const record = await lookupSupplier(req.params.uuid);
  res.status(200).json(record);
}

/**
 * @method create
 *
 * @description
 * POST /supplier
 *
 * This method creates a new supplier entity in the database and sets up the
 * creditor for the it.
 */
async function create(req, res) {
  const data = db.convert(req.body, ['contact_uuid']);

  // provide uuid if the client has not specified
  const recordUuid = data.uuid || uuid();
  const transaction = db.transaction();

  const creditorUuid = db.bid(uuid());
  const creditorGroupUuid = db.bid(data.creditor_group_uuid);

  delete data.creditor_group_uuid;
  data.creditor_uuid = creditorUuid;
  data.uuid = db.bid(recordUuid);

  const writeCreditorQuery = 'INSERT INTO creditor VALUES (?, ?, ?);';

  const writeSupplierQuery = 'INSERT INTO supplier SET ?;';

  transaction
    .addQuery(writeCreditorQuery, [creditorUuid, creditorGroupUuid, data.display_name])
    .addQuery(writeSupplierQuery, [data]);

  await transaction.execute();
  res.status(201).json({ uuid : recordUuid });

}

/**
 * @method update
 *
 * @description
 * PUT /suppliers/:uuid
 *
 * Updates a supplier in the database.
 */
async function update(req, res) {
  const data = db.convert(req.body, ['contact_uuid']);
  delete data.uuid;
  delete data.creditor_uuid;

  let creditorGroupUuid;
  if (data.creditor_group_uuid) {
    creditorGroupUuid = db.bid(data.creditor_group_uuid);
    delete data.creditor_group_uuid;
  }

  const updateSupplierQuery = 'UPDATE supplier SET ? WHERE uuid = ?;';

  const updateCreditorQuery = `
    UPDATE creditor JOIN supplier ON creditor.uuid = supplier.creditor_uuid
    SET group_uuid = ? WHERE supplier.uuid = ?;
  `;

  const transaction = db.transaction();

  transaction
    .addQuery(updateSupplierQuery, [data, db.bid(req.params.uuid)]);

  if (creditorGroupUuid) {
    transaction.addQuery(updateCreditorQuery, [creditorGroupUuid, db.bid(req.params.uuid)]);
  }

  await transaction.execute();
  const record = await lookupSupplier(req.params.uuid);
  res.status(200).json(record);
}

/**
 * @method search
 *
 * @description
 * GET /suppliers/search
 *
 * This method search for a supplier by their display_name.
 */
async function search(req, res) {
  const limit = Number(req.query.limit);

  let sql = `
    SELECT BUID(supplier.uuid) as uuid, BUID(supplier.creditor_uuid) as creditor_uuid, supplier.display_name,
      supplier.address_1, supplier.address_2, supplier.email, supplier.fax, supplier.note, supplier.phone,
      supplier.international, supplier.locked, BUID(creditor.group_uuid) AS creditor_group_uuid
    FROM supplier 
    JOIN creditor ON supplier.creditor_uuid = creditor.uuid
    LEFT JOIN entity ON entity.uuid = supplier.contact_uuid
    WHERE supplier.display_name LIKE "%?%"
  `;

  if (!Number.isNaN(limit)) {
    sql += `${sql}LIMIT ${Math.floor(limit)};`;
  }

  const rows = await db.exec(sql, [req.query.display_name]);
  res.status(200).json(rows);
}

async function remove(req, res) {
  const _uuid = req.params.uuid;
  const sql = 'DELETE FROM supplier WHERE uuid=?';
  await db.exec(sql, db.bid(_uuid));
  res.sendStatus(200);
}

// get list of a supplier
exports.list = list;

// get details of a supplier
exports.detail = detail;

// create a new supplier
exports.create = create;

// update supplier information
exports.update = update;

// search suppliers data
exports.search = search;

exports.remove = remove;
