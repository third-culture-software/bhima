/**
 * HTTP END POINT
 *
 * API for the entities/groups http end point
 */

const db = require('../../../../lib/db');
const util = require('../../../../lib/util');

exports.list = list;
exports.details = details;
exports.update = update;
exports.remove = remove;
exports.create = create;

async function list(req, res) {
  const query = `
    SELECT BUID(eg.uuid) AS uuid, eg.label, GROUP_CONCAT(e.display_name, ', ') AS entities
    FROM entity_group_entity ege
      JOIN entity_group eg ON eg.uuid = ege.entity_group_uuid
      JOIN entity e ON e.uuid = ege.entity_uuid
    GROUP BY eg.uuid;
  `;
  const rows = await db.exec(query);
  res.status(200).json(rows);

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

async function details(req, res) {
  const uuid = db.bid(req.params.uuid);

  const bundle = await lookupEntity(uuid);
  res.status(200).json(bundle);
}

async function update(req, res) {
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

  await transaction.execute();
  res.sendStatus(204);
}

async function remove(req, res) {
  const queryEntityGroup = `
    DELETE FROM entity_group WHERE uuid = ?;
  `;
  const queryDropEntities = `
    DELETE FROM entity_group_entity WHERE entity_group_uuid = ?;
  `;

  await db.transaction()
    .addQuery(queryDropEntities, [db.bid(req.params.uuid)])
    .addQuery(queryEntityGroup, [db.bid(req.params.uuid)])
    .execute();

  res.sendStatus(204);
}

async function create(req, res) {
  const { entities } = req.body;

  const params = {
    uuid : db.bid(util.uuid()),
    label : req.body.label,
  };

  await db.exec('INSERT INTO entity_group SET ?;', [params]);
  const transaction = db.transaction();

  entities.forEach(entityUuid => {
    const value = {
      entity_uuid : db.bid(entityUuid),
      entity_group_uuid : params.uuid,
    };
    transaction.addQuery('INSERT INTO entity_group_entity SET ?;', [value]);
  });

  await transaction.execute();
  res.status(201).json({ uuid : params.uuid });
}
