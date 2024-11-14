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

function list(req, res, next) {
  const query = `
    SELECT
      BUID(e.uuid) AS uuid, e.display_name, e.gender, e.title, e.email, e.phone, e.address,
      e.reference, et.id AS entity_type_id, et.label, et.translation_key
    FROM entity e
    JOIN entity_type et ON et.id = e.entity_type_id
  `;
  db.exec(query)
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

function details(req, res, next) {
  const buid = db.bid(req.params.uuid);
  fetchEntity(buid)
    .then(entity => res.status(200).json(entity))
    .catch(next);

}

/**
 * PUT /entities/:uuid
 */
function update(req, res, next) {
  const query = `
    UPDATE entity SET ? WHERE uuid = ?;
  `;

  const params = req.body;
  const buid = db.bid(req.params.uuid);

  if (params.uuid) {
    delete params.uuid;
  }

  db.exec(query, [params, buid])
    .then(() => fetchEntity(buid))
    .then(entity => res.status(200).json(entity))
    .catch(next);

}

/**
 * DELETE /entities/:uuid
 */
function remove(req, res, next) {
  const query = `
    DELETE FROM entity WHERE uuid = ?;
  `;
  const buid = db.bid(req.params.uuid);
  db.exec(query, [buid])
    .then(() => res.sendStatus(204))
    .catch(next);

}

function create(req, res, next) {
  const query = `
    INSERT INTO entity SET ?;
  `;
  const params = req.body;
  const identifier = params.uuid || util.uuid();
  params.uuid = db.bid(identifier);
  db.exec(query, [params])
    .then(() => res.status(201).json({ uuid : identifier }))
    .catch(next);

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
