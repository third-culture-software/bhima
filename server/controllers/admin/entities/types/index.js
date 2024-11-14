/**
 * HTTP END POINT
 * API for the entities/types http end point
 */
const db = require('../../../../lib/db');

exports.list = list;
exports.details = details;
exports.update = update;
exports.remove = remove;
exports.create = create;

function list(req, res, next) {
  const query = `
    SELECT id, label, translation_key FROM entity_type
  `;
  db.exec(query)
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

function details(req, res, next) {
  const query = `
    SELECT id, label, translation_key FROM entity_type
    WHERE id = ?;
  `;
  db.one(query, [req.params.id])
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

function update(req, res, next) {
  const query = `
    UPDATE entity_type SET ? WHERE id = ?;
  `;
  const params = req.body;
  if (params.id) {
    delete params.id;
  }
  db.exec(query, [params, req.params.id])
    .then(() => res.sendStatus(204))
    .catch(next);

}

function remove(req, res, next) {
  const query = `
    DELETE FROM entity_type WHERE id = ?;
  `;
  db.exec(query, [req.params.id])
    .then(() => res.sendStatus(204))
    .catch(next);

}

function create(req, res, next) {
  const query = `
    INSERT INTO entity_type SET ?;
  `;
  const params = req.body;
  db.exec(query, [params])
    .then((result) => {
      res.status(201).json({ id : result.insertId });
    })
    .catch(next);

}
