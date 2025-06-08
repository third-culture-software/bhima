/**
 * @overview Users
 *
 * @description
 * The /users API endpoint.  This file is responsible for implementing CRUD
 * operations on the `user` table.
 *
 * @requires db
 * @requires FilterParser
 * @requires errors
 */

const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const { NotFound, BadRequest } = require('../../../lib/errors');

// expose submodules
exports.projects = require('./projects');
exports.depots = require('./depots');
exports.depotsSupervision = require('./depotsSupervision');
exports.cashboxes = require('./cashboxes');

exports.fetchUser = fetchUser;

// expose API routes
exports.list = list;
exports.detail = detail;
exports.exists = exists;
exports.create = create;
exports.update = update;
exports.delete = remove;
exports.password = password;
exports.lookup = lookupUser;
exports.depotUsersManagment = depotUsersManagment;
exports.depotUsersSupervision = depotUsersSupervision;

/**
 * @function lookupUser
 *
 * @description
 * This function looks up a user by their id in the database.  It returns the
 * full details of the user, including a list of their project and permission
 * ids.
 *
 * @param {Number} id - the id of a user in the database
 * @returns {Promise} A promise object with
 */
async function lookupUser(id) {

  let sql = `
    SELECT user.id, user.username, user.email, user.display_name,
      user.active, user.last_login, user.deactivated, user.enable_external_access,
      user.preferred_language,
      GROUP_CONCAT(DISTINCT role.label ORDER BY role.label DESC SEPARATOR ', ') AS roles,
      GROUP_CONCAT(DISTINCT depot.text ORDER BY depot.text DESC SEPARATOR ', ') AS depots,
      GROUP_CONCAT(DISTINCT cb.label ORDER BY cb.label DESC SEPARATOR ', ') AS cashboxes
    FROM user
      LEFT JOIN user_role ur ON user.id = ur.user_id
      LEFT JOIN role ON role.uuid = ur.role_uuid
      LEFT JOIN depot_permission dp ON dp.user_id = user.id
      LEFT JOIN depot ON dp.depot_uuid = depot.uuid
      LEFT JOIN cashbox_permission ON user.id = cashbox_permission.user_id
      LEFT JOIN cash_box cb ON cashbox_permission.cashbox_id = cb.id
    WHERE user.id = ?
    GROUP BY user.id;
  `;

  const user = await db.one(sql, [id]);

  // query project permissions
  sql = `
    SELECT pp.project_id FROM project_permission AS pp
    WHERE user_id = ?;
  `;

  const rows = await db.exec(sql, [id]);
  const projects = rows.map(row => row.project_id);

  user.projects = projects;

  return user;
}

async function fetchUser(params) {
  const options = params;
  db.convert(options, ['role_uuid', 'depot_uuid']);
  const filters = new FilterParser(options, { tableAlias : 'user' });

  const sql = `
  SELECT user.id, user.display_name, user.username, user.deactivated, user.last_login,
    user.enable_external_access, user.created_at, user.preferred_language,
    GROUP_CONCAT(DISTINCT role.label ORDER BY role.label DESC SEPARATOR ', ') AS roles,
    GROUP_CONCAT(DISTINCT depot.text ORDER BY depot.text DESC SEPARATOR ', ') AS depots,
    GROUP_CONCAT(DISTINCT cb.label ORDER BY cb.label DESC SEPARATOR ', ') AS cashboxes
  FROM user
    LEFT JOIN user_role ur ON user.id = ur.user_id
    LEFT JOIN role ON role.uuid = ur.role_uuid
    LEFT JOIN depot_permission dp ON dp.user_id = user.id
    LEFT JOIN depot ON dp.depot_uuid = depot.uuid
    LEFT JOIN cashbox_permission ON user.id = cashbox_permission.user_id
    LEFT JOIN cash_box cb ON cashbox_permission.cashbox_id = cb.id
`.trim();

  filters.equals('id');
  filters.equals('user_id', 'id');
  filters.equals('role_uuid', 'role_uuid', 'ur');
  filters.equals('depot_uuid', 'depot_uuid', 'dp');
  filters.equals('cashbox_id', 'id', 'cb');
  filters.fullText('display_name');
  filters.period('period', 'created_at');
  filters.period('date_created', 'created_at');
  filters.dateFrom('custom_period_start', 'created_at');
  filters.dateTo('custom_period_end', 'created_at');
  filters.dateFrom('login_date_from', 'last_login');
  filters.dateTo('login_date_to', 'last_login');

  filters.setGroup('GROUP BY user.id');
  filters.setOrder('ORDER BY user.display_name DESC');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

/**
 * @function list
 *
 * @description
 * If the client queries to /users endpoint, the API will respond with an array
 * of zero or more JSON objects, with id, username, display_name, activation state,
 * roles and depots keys.
 *
 * GET /users
 */
async function list(req, res) {
  const users = await fetchUser(req.query);
  res.status(200).json(users);
}

/**
 * @function detail
 *
 * @description
 * This endpoint will return a single JSON object containing the full user row
 * for the user with matching ID.  If no matching user exists, it will return a
 * 404 error.
 *
 * For consistency with the CREATE method, this route also returns a user's project
 * permissions.
 *
 * GET /users/:id
 */
async function detail(req, res) {
  const data = await lookupUser(req.params.id);
  res.status(200).json(data);
}

async function exists(req, res) {
  const sql = 'SELECT count(id) as nbr FROM user WHERE username = ?';
  const data = await db.one(sql, req.params.username);
  res.send(data.nbr !== 0);
}

/**
 * @method create
 *
 * @description
 * POST /users
 *
 * This endpoint creates a new user from a JSON object.  Required columns are
 * enforced in the database.  Unlike before, the user is created with project
 * permissions.  A user without project access does not make any sense.
 *
 * If the checks succeed, the user password is hashed and stored in the database.
 * A single JSON is returned to the client with the user id.
 *
 */
async function create(req, res) {
  const data = req.body;

  let sql = `
    INSERT INTO user (username, password, email, display_name) VALUES
    (?, MYSQL5_PASSWORD(?), ?, ?);
  `;

  const row = await db.exec(sql, [data.username, data.password, data.email, data.display_name]);

  // retain the insert id
  const userId = row.insertId;

  sql = 'INSERT INTO project_permission (user_id, project_id) VALUES ?;';

  const projects = data.projects.map(projectId => [userId, projectId]);

  await db.exec(sql, [projects]);
  // send the ID back to the client
  res.status(201).json({ id : userId });
}

/**
 * @method update
 *
 * @description
 * PUT /users/:id
 *
 * This endpoint updates a user's information with ID :id.  If the user is not
 * found, the server sends back a 404 error.
 *
 * This method is reserved for changed all other user properties, but NOT the
 * user's password.  To change the user password, use a PUT to users/:id/password
 * with two password fields, password and passwordVerify.
 */
async function update(req, res) {
  const data = req.body;
  const projects = req.body.projects || [];

  // if the password is sent, return an error
  if (data.password) {
    throw new BadRequest(
      `You cannot change the password field with this API.`,
      `ERRORS.PROTECTED_FIELD`,
    );
  }

  // clean default properties before the record is updated
  delete data.projects;
  delete data.id;
  delete data.created_at;

  const transaction = db.transaction();

  // if there are projects, add those queries to the transaction first
  if (projects.length) {
    // turn the project id list into user id and project id pairs
    const projectIds = projects.map(projectId => [req.params.id, projectId]);

    transaction
      .addQuery(
        'DELETE FROM project_permission WHERE user_id = ?;',
        [req.params.id],
      )

      .addQuery(
        'INSERT INTO project_permission (user_id, project_id) VALUES ?;',
        [projectIds],
      );
  }

  // begin updating the user if data was sent back (the user might has
  // simply sent permissions changes).
  if (Object.keys(data).length !== 0) {
    transaction
      .addQuery('UPDATE user SET ? WHERE id = ?;', [data, req.params.id]);
  }

  await transaction.execute();
  const user = await lookupUser(req.params.id);
  res.status(200).json(user);
}

/**
 * @function password
 *
 * @description
 * PUT /users/:id/password
 *
 * This endpoint updates a user's password with ID :id.  If the user is not
 * found, the server sends back a 404 error.
 */
async function password(req, res) {
  // TODO -- strict check to see if the user is either signed in or has
  // sudo permissions.
  const sql = `UPDATE user SET password = MYSQL5_PASSWORD(?) WHERE id = ?;`;

  await db.exec(sql, [req.body.password, req.params.id]);
  const user = await lookupUser(req.params.id);
  res.status(200).json(user);
}

/**
 * @function remove
 *
 * @description
 * DELETE /users/:id
 *
 * If the user exists delete it.
 */
async function remove(req, res) {
  const sql = `DELETE FROM user WHERE id = ?;`;

  const { affectedRows } = await db.exec(sql, [req.params.id]);

  if (affectedRows === 0) {
    throw new NotFound(`Could not find a user with id ${req.params.id}`);
  }

  res.sendStatus(204);
}

/**
 * POST '/users/:uuid/depotUsersManagment'
 *
 * Creates and updates a user's depots for Management.  This works by completely deleting
 * the user's depots and then replacing them with the new depots set.
 */
async function depotUsersManagment(req, res) {
  const transaction = db.transaction();
  const uid = db.bid(req.params.uuid);

  transaction
    .addQuery('DELETE FROM depot_permission WHERE depot_uuid = ?;', [uid]);

  // if an array of permission has been sent, add them to an INSERT query
  const users = req.body.users || [];

  if (users.length) {
    const data = [].concat(users).map(id => ([uid, id]));

    transaction
      .addQuery('INSERT INTO depot_permission (depot_uuid, user_id) VALUES ?', [data]);
  }

  await transaction.execute();
  res.sendStatus(201);
}

/**
 * POST '/users/:uuid/depotUsersSupervision'
 *
 * Creates and updates a user's depots for supervision.  This works by completely deleting
 * the user's depots and then replacing them with the new depots set.
 */
async function depotUsersSupervision(req, res) {
  const transaction = db.transaction();
  const uid = db.bid(req.params.uuid);

  transaction
    .addQuery('DELETE FROM depot_supervision WHERE depot_uuid = ?;', [uid]);

  // if an array of permission has been sent, add them to an INSERT query
  const users = req.body.users || [];

  if (users.length) {
    const data = [].concat(users).map(id => ([uid, id]));

    transaction
      .addQuery('INSERT INTO depot_supervision (depot_uuid, user_id) VALUES ?', [data]);
  }

  await transaction.execute();
  res.sendStatus(201);
}
