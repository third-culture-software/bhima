/**
 * HTTP END POINT
 *
 * API for the entities/groups http end point
 */
const _ = require('lodash');

const db = require('../../../../lib/db');
const util = require('../../../../lib/util');

exports.list = list;
exports.details = details;
exports.update = update;
exports.remove = remove;
exports.create = create;

function list(req, res, next) {
  const query = `
    SELECT BUID(eg.uuid) AS uuid, eg.label, GROUP_CONCAT(e.display_name, ', ') AS entities
    FROM entity_group_entity ege
      JOIN entity_group eg ON eg.uuid = ege.entity_group_uuid
      JOIN entity e ON e.uuid = ege.entity_uuid
    GROUP BY eg.uuid;
  `;
  db.exec(query)
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

async function lookupEntity(uuid) {
  const query = `
    SELECT BUID(uuid) AS uuid, label FROM entity_group
    WHERE uuid = ? LIMIT 1;
  `;

  const group = await db.one(query, [uuid]);

  const queryEntities = `
    SELECT BUID(ege.entity_uuid) AS uuid, e.display_name
    FROM entity_group_entity ege
      JOIN entity e ON e.uuid = ege.entity_uuid
    WHERE ege.entity_group_uuid = ?;
  `;

  group.entities = await db.exec(queryEntities, [uuid]);

  return group;
}

function details(req, res, next) {
  const uuid = db.bid(req.params.uuid);

  lookupEntity(uuid)
    .then(bundle => {
      res.status(200).json(bundle);
    })
    .catch(next);
}

function update(req, res, next) {
  const { entities } = req.body;
  const { uuid } = req.params;
  const entityGroupUuid = db.bid(uuid);

  delete req.body.uuid;
  delete req.body.entities;

  const transaction = db.transaction();
  transaction.addQuery(
    'DELETE FROM entity_group_entity WHERE entity_group_uuid = ?;',
    [entityGroupUuid],
  );
  transaction.addQuery(
    'UPDATE entity_group SET ? WHERE uuid = ?;',
    [req.body, entityGroupUuid],
  );
  entities.forEach(entityUuid => {
    const value = {
      entity_uuid : db.bid(entityUuid),
      entity_group_uuid : entityGroupUuid,
    };
    transaction.addQuery(
      'INSERT INTO entity_group_entity SET ?;',
      [value],
    );
  });

  transaction.execute()
    .then(() => res.sendStatus(204))
    .catch(next);

}

function remove(req, res, next) {
  const queryEntityGroup = `
    DELETE FROM entity_group WHERE uuid = ?;
  `;
  const queryDropEntities = `
    DELETE FROM entity_group_entity WHERE entity_group_uuid = ?;
  `;

  db.transaction()
    .addQuery(queryDropEntities, [db.bid(req.params.uuid)])
    .addQuery(queryEntityGroup, [db.bid(req.params.uuid)])
    .execute()
    .then(() => res.sendStatus(204))
    .catch(next);

}

function create(req, res, next) {
  const { entities } = req.body;

  const params = {
    uuid : db.bid(util.uuid()),
    label : req.body.label,
  };

  db.exec('INSERT INTO entity_group SET ?;', [params])
    .then(() => {
      const transaction = db.transaction();

      entities.forEach(entityUuid => {
        const value = {
          entity_uuid : db.bid(entityUuid),
          entity_group_uuid : params.uuid,
        };
        transaction.addQuery('INSERT INTO entity_group_entity SET ?;', [value]);
      });

      return transaction.execute();
    })
    .then(() => {
      res.status(201).json({ uuid : params.uuid });
    })
    .catch(next);

}
