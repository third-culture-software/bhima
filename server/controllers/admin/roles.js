const db = require('../../lib/db');

module.exports = {
  list,
  detail,
  create,
  update,
  remove,
  units,
  assignUnitsToRole,
  assignRolesToUser,
  listForUser,
  rolesAction,
  hasAction,
  assignActionToRole,
  isAllowed,
};

async function list(req, res) {
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, COUNT(ru.uuid) as numUsers
    FROM role r LEFT JOIN user_role ru ON r.uuid = ru.role_uuid
    GROUP BY r.uuid
    ORDER BY r.label ASC
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);

}

async function detail(req, res) {
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, COUNT(ru.uuid) as numUsers
    FROM role r LEFT JOIN user_role ru ON r.uuid = ru.role_uuid
    WHERE uuid = ?;
  `;

  const binaryUuid = db.bid(req.params.uuid);

  const rows = await db.one(sql, binaryUuid);
  res.status(200).json(rows);
}

// create a new role
async function create(req, res) {
  const sql = `
    INSERT INTO  role(uuid, label)
    VALUES(?, ?)
  `;

  const rows = await db.exec(sql, [db.uuid(), req.body.label]);
  res.status(201).json(rows);
}

async function update(req, res) {
  const role = req.body;
  delete role.uuid;
  delete role.numUsers;

  const sql = `UPDATE role SET ? WHERE uuid = ?`;

  const rows = await db.exec(sql, [role, db.bid(req.params.uuid)]);
  res.status(200).json(rows);
}

async function remove(req, res) {
  const binaryUuid = db.bid(req.params.uuid);

  const sql = `DELETE FROM role WHERE uuid = ?`;
  const rows = await db.exec(sql, binaryUuid);
  res.status(200).json(rows);
}

// affect permission to a specific role
async function assignUnitsToRole(req, res) {
  const data = req.body;

  const unitIds = [].concat(data.unit_ids);
  const roleUuid = db.bid(data.role_uuid);

  const deleteFromRole = 'DELETE FROM role_unit WHERE role_uuid = ?;';
  const affectPage = `
    INSERT INTO  role_unit (uuid, unit_id, role_uuid)
    VALUES( ?, ?, ?);
  `;

  await db.exec(deleteFromRole, roleUuid);
  const promises = unitIds.map(id => db.exec(affectPage, [db.uuid(), id, roleUuid]));
  await Promise.all(promises);
  res.sendStatus(201);
}

// retrieves affected and not affected role by a user id
async function listForUser(req, res) {
  const userId = req.params.id;
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, IFNULL(s.affected, 0) as affected
    FROM role r
    LEFT JOIN (
      SELECT ro.uuid, 1 as affected
      FROM user_role ur
      JOIN role ro ON ur.role_uuid = ro.uuid
      WHERE ur.user_id = ?
    )s ON s.uuid = r.uuid
    ORDER BY r.label
  `;

  const roles = await db.exec(sql, [userId, userId]);
  res.status(200).json(roles);
}

async function rolesAction(req, res) {
  const roleUuid = db.bid(req.params.roleUuid);

  const sql = `
    SELECT a.id, a.description, IFNULL(s.affected, 0) as affected
    FROM actions a
    LEFT JOIN (
      SELECT  actions_id , 1 as affected
      FROM role_actions ra
      JOIN role ro ON ra.role_uuid = ro.uuid
      WHERE ro.uuid = ?
    )s ON s.actions_id = a.id
  `;

  const actions = await db.exec(sql, [roleUuid]);
  res.status(200).json(actions);
}

// affect roles to a user
// actions ares permissions for a role used most of the time in the view
// some actions are sensitive
async function assignActionToRole(req, res) {
  const data = req.body;

  const actionIds = [...data.action_ids];

  const roleUuid = db.bid(data.role_uuid);
  const transaction = db.transaction();

  const deleleUserRoles = `DELETE FROM role_actions WHERE role_uuid = ?`;
  const addAction = `INSERT INTO role_actions SET ?`;

  await db.exec(deleleUserRoles, roleUuid);
  actionIds.forEach(actionId => {
    transaction.addQuery(addAction, { uuid : db.uuid(), role_uuid : roleUuid, actions_id : actionId });
  });
  await transaction.execute();
  res.sendStatus(201);
}

async function isAllowed(params) {
  const { actionId, userId } = params;
  const sql = `
    SELECT count(ra.uuid) as nbr FROM role_actions ra
    JOIN user_role as ur ON ur.role_uuid = ra.role_uuid
    WHERE actions_id =? AND ur.user_id = ?
  `;

  const result = await db.exec(sql, [actionId, userId]);
  if (result.length > 0) {
    return result[0].nbr > 0;
  }
  return false;
}

async function hasAction(req, res) {
  const result = await isAllowed({
    actionId : req.params.action_id,
    userId : req.session.user.id,
  });

  if (result) {
    res.status(200).json(true);
  } else {
    res.status(403).json(false);
  }
}

// affect roles to a user
// roles ares permissions
async function assignRolesToUser(req, res) {
  const data = req.body;
  const rolesUuids = [].concat(data.role_uuids);
  const userId = data.user_id;

  const deleleUserRoles = 'DELETE FROM user_role WHERE user_id = ?;';
  const addRole = 'INSERT INTO user_role SET ?;';

  await db.exec(deleleUserRoles, userId);

  await Promise.all(rolesUuids
    .map(roleUuid => db.exec(addRole, {
      uuid : db.uuid(),
      role_uuid : db.bid(roleUuid),
      user_id : userId,
    })));

  res.sendStatus(201);

}

/**
 * @function units
 *
 * @description
 * Returns the list of units associated with a role
 *
 * ROUTE:
 * GET  /roles/${uuid}/units
 */
async function units(req, res) {
  const roleUuid = db.bid(req.params.uuid);

  const sql = `
    SELECT unit.id, unit.key, unit.parent
    FROM role
      JOIN role_unit ON role.uuid = role_unit.role_uuid
      JOIN unit ON role_unit.unit_id = unit.id
    WHERE role.uuid = ?;
  `;

  const modules = await db.exec(sql, [roleUuid]);
  res.status(200).json(modules);
}
