/**
 * HTTP END POINT
 * API for the entities/ http end point
 */
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const types = require('./types');
const groups = require('./groups');

exports.types = types;
exports.groups = groups;
exports.list = list;
exports.details = details;
exports.update = update;
exports.remove = remove;
exports.create = create;

async function list(req, res) {
  const query = `
    SELECT
      BUID(e.uuid) AS uuid, e.display_name, e.gender, e.title, e.email, e.phone, e.address,
      e.reference, et.id AS entity_type_id, et.label, et.translation_key
    FROM entity e
    JOIN entity_type et ON et.id = e.entity_type_id
  `;
  const rows = await db.exec(query);
  res.status(200).json(rows);
}

async function details(req, res) {
  const buid = db.bid(req.params.uuid);
  const entity = await fetchEntity(buid);
  res.status(200).json(entity);
}

/**
 * PUT /entities/:uuid
 */
async function update(req, res) {
  const query = `
    UPDATE entity SET ? WHERE uuid = ?;
  `;

  const params = req.body;
  const buid = db.bid(req.params.uuid);

  if (params.uuid) {
    delete params.uuid;
  }

  await db.exec(query, [params, buid]);
  const entity = await fetchEntity(buid);
  res.status(200).json(entity);
}

/**
 * DELETE /entities/:uuid
 */
async function remove(req, res) {
  const query = `
    DELETE FROM entity WHERE uuid = ?;
  `;
  const buid = db.bid(req.params.uuid);
  await db.exec(query, [buid]);
  res.sendStatus(204);
}

async function create(req, res) {
  const query = `
    INSERT INTO entity SET ?;
  `;
  const params = req.body;
  const identifier = params.uuid || util.uuid();
  params.uuid = db.bid(identifier);
  await db.exec(query, [params]);
  res.status(201).json({ uuid : identifier });
}

/**
 * @function fetchEntity
 * @param {object} uuid a binary uuid
 */
function fetchEntity(uuid) {
  const query = `
    SELECT
      BUID(e.uuid) AS uuid, e.display_name, e.title, e.gender, e.email, e.phone, e.address,
      e.reference, et.id AS entity_type_id, et.label, et.translation_key
    FROM entity e
    JOIN entity_type et ON et.id = e.entity_type_id
    WHERE uuid = ?;
  `;
  return db.one(query, [uuid]);
}
