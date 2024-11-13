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

function list(req, res, next) {
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, COUNT(ru.uuid) as numUsers
    FROM role r LEFT JOIN user_role ru ON r.uuid = ru.role_uuid
    GROUP BY r.uuid
    ORDER BY r.label ASC
  `;

  db.exec(sql)
    .then(rows => {
      res.json(rows);
    }).catch(next)
    
}

function detail(req, res, next) {
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, COUNT(ru.uuid) as numUsers
    FROM role r LEFT JOIN user_role ru ON r.uuid = ru.role_uuid
    WHERE uuid = ?;
  `;

  const binaryUuid = db.bid(req.params.uuid);

  db.one(sql, binaryUuid)
    .then(rows => {
      res.json(rows);
    })
    .catch(next)
    
}

// create a new role
function create(req, res, next) {
  const sql = `
    INSERT INTO  role(uuid, label)
    VALUES(?, ?)
  `;

  db.exec(sql, [db.uuid(), req.body.label])
    .then(rows => {
      res.status(201).json(rows);
    })
    .catch(next)
    
}

function update(req, res, next) {
  const role = req.body;
  delete role.uuid;
  delete role.numUsers;

  const sql = `UPDATE role SET ? WHERE uuid = ?`;

  db.exec(sql, [role, db.bid(req.params.uuid)])
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

function remove(req, res, next) {
  const binaryUuid = db.bid(req.params.uuid);

  const sql = `DELETE FROM role WHERE uuid = ?`;
  db.exec(sql, binaryUuid)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

// affect permission to a specific role
function assignUnitsToRole(req, res, next) {
  const data = req.body;

  const unitIds = [].concat(data.unit_ids);
  const roleUuid = db.bid(data.role_uuid);

  const deleteFromRole = 'DELETE FROM role_unit WHERE role_uuid = ?;';
  const affectPage = `
    INSERT INTO  role_unit (uuid, unit_id, role_uuid)
    VALUES( ?, ?, ?);
  `;

  db.exec(deleteFromRole, roleUuid)
    .then(() => {
      const promises = unitIds.map(id => db.exec(affectPage, [db.uuid(), id, roleUuid]));
      return Promise.all(promises);
    })
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next)
    
}

// retrieves affected and not affected role by a user id
function listForUser(req, res, next) {
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

  db.exec(sql, [userId, userId])
    .then((roles) => {
      res.json(roles);
    })
    .catch(next)
    
}

function rolesAction(req, res, next) {
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

  db.exec(sql, [roleUuid])
    .then(actions => {
      res.json(actions);
    })
    .catch(next)
    
}

// affect roles to a user
// actions ares permissions for a role used most of the time in the view
// some actions are sensitive
function assignActionToRole(req, res, next) {
  const data = req.body;

  const actionIds = [...data.action_ids];

  const roleUuid = db.bid(data.role_uuid);
  const transaction = db.transaction();

  const deleleUserRoles = `DELETE FROM role_actions WHERE role_uuid = ?`;
  const addAction = `INSERT INTO role_actions SET ?`;

  db.exec(deleleUserRoles, roleUuid)
    .then(() => {
      actionIds.forEach(actionId => {
        transaction.addQuery(addAction, { uuid : db.uuid(), role_uuid : roleUuid, actions_id : actionId });
      });
      return transaction.execute();
    })
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next)
    
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

function hasAction(req, res, next) {
  isAllowed({
    actionId : req.params.action_id,
    userId : req.session.user.id,
  }).then(result => {
    if (result) {
      res.status(200).json(true);
    } else {
      res.status(403).json(false);
    }
  })
    .catch(next);
}

// affect roles to a user
// roles ares permissions
function assignRolesToUser(req, res, next) {
  const data = req.body;
  const rolesUuids = [].concat(data.role_uuids);
  const userId = data.user_id;

  const deleleUserRoles = 'DELETE FROM user_role WHERE user_id = ?;';
  const addRole = 'INSERT INTO user_role SET ?;';

  db.exec(deleleUserRoles, userId)
    .then(() => {
      const promises = rolesUuids
        .map(roleUuid => db.exec(addRole, {
          uuid : db.uuid(),
          role_uuid : db.bid(roleUuid),
          user_id : userId,
        }));

      return Promise.all(promises);
    })
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next)
    
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
function units(req, res, next) {
  const roleUuid = db.bid(req.params.uuid);

  const sql = `
    SELECT unit.id, unit.key, unit.parent
    FROM role
      JOIN role_unit ON role.uuid = role_unit.role_uuid
      JOIN unit ON role_unit.unit_id = unit.id
    WHERE role.uuid = ?;
  `;

  db.exec(sql, [roleUuid])
    .then(modules => {
      res.status(200).json(modules);
    })
    .catch(next)
    
}
