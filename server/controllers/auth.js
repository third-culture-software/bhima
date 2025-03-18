/**
 * @overview
 * Authentication Controller
 *
 * This controller is responsible for managing user authentication and
 * authorization to the entire application stack.
 *
 * @requires lodash
 * @requires debug
 * @requires lib/db
 * @requires lib/errors/Unauthorized
 */

const _ = require('lodash');
const debug = require('debug')('app');
const JWTConfig = require('../config/jwt');
const db = require('../lib/db');
const Unauthorized = require('../lib/errors/Unauthorized');

// POST /auth/login
exports.login = loginRoute;

// GET /auth/logout
exports.logout = logout;

// POST /auth/reload
exports.reload = reload;

// expose session locally
exports.loadSessionInformation = loadSessionInformation;

function loginRoute(req, res, next) {
  const { username, password, project } = req.body;
  login(username, password, project)
    .then(session => {
      // bind the session variables
      _.merge(req.session, session);
      session.token = JWTConfig.create({ ...session.user });
      // send the session data back to the client
      res.status(200).json(session);
    })
    .catch(next);
}

/**
 * @method login
 *
 * @description
 * Logs a client into the server.  The /login route accepts a POST request with
 * a username, password, and project id.  It checks if the username and password
 * exist in the database, then verifies that the user has permission to access
 * the database all enterprise, project, and user data for easy access.
 */
async function login(username, password, projectId) {
  const sql = `
    SELECT
      user.id, user.username, user.display_name, user.email, user.deactivated,
      project.enterprise_id , project.id AS project_id
    FROM user
    JOIN project_permission JOIN project ON user.id = project_permission.user_id
      AND project.id = project_permission.project_id
    WHERE
      user.username = ? AND user.password = MYSQL5_PASSWORD(?)
      AND project_permission.project_id = ?;
  `;

  const sqlUser = `
    SELECT user.id, user.deactivated FROM user
    WHERE user.username = ? AND user.password = MYSQL5_PASSWORD(?);
  `;

  // a role should be assigned to the user
  // each role has some units(paths or urls) that the user is allowed to access(permissions)
  const sqlPermission = `
    SELECT  user.id
    FROM  user_role
      JOIN user ON user.id =  user_role.user_id
    WHERE user.username = ? AND user.password = MYSQL5_PASSWORD(?)
  `;

  const [connect, user, permission] = await Promise.all([
    db.exec(sql, [username, password, projectId]),
    db.exec(sqlUser, [username, password]),
    db.exec(sqlPermission, [username, password]),
  ]);

  const hasAuthorization = connect.length > 0;
  const isUnrecognizedUser = user.length === 0;
  const isMissingPermissions = permission.length === 0;

  if (hasAuthorization) {
    if (Boolean(user[0].deactivated)) {
      throw new Unauthorized('The user is not activated, contact the administrator', 'FORM.ERRORS.LOCKED_USER');
    }

    if (isMissingPermissions) {
      throw new Unauthorized('No permissions in the database.', 'ERRORS.NO_PERMISSIONS');
    }
  } else if (isUnrecognizedUser) {
    throw new Unauthorized('Bad username and password combination.');
  } else {
    throw new Unauthorized('No permissions for that project.', 'ERRORS.NO_PROJECT');
  }

  // user is authorised at this point, touch their login information
  await db.exec('UPDATE user SET last_login = NOW() WHERE user.id = ?', user[0].id);

  return loadSessionInformation(connect[0]);
}

/**
 * @method logout
 *
 * Destroys the server side session and sets the user as inactive.
 */
function logout(req, res, next) {
  const sql = 'UPDATE user SET user.active = 0 WHERE user.id = ?;';

  db.exec(sql, [req.session.user.id])
    .then(() => {
      // destroy the session
      req.session.destroy();
      res.sendStatus(200);
    })
    .catch(next);

}

/**
 * @function loadSessionInformation
 *
 * @description
 * This method takes in a user object (with an id) and loads all the session
 * information about it.  This can be used to populate or refresh req.session
 * in case there are user changes that are made (such as to the enterprise,
 * project, or otherwise).
 *
 * @param {Object} user - the user object to look up the session
 *
 * @returns {Promise} - a promise resolving to the session
 *
 * @private
 */
async function loadSessionInformation(user) {
  const session = {};

  let sql = `
    SELECT user.id, user.username, user.display_name, user.email, project.enterprise_id , project.id AS project_id
    FROM user JOIN project_permission JOIN project ON
      user.id = project_permission.user_id AND project.id = project_permission.project_id
    WHERE user.id = ? AND project.id = ?;
  `;

  session.user = await db.one(sql, [user.id, user.project_id]);

  sql = `
    SELECT DISTINCT actions_id AS id FROM role_actions
    JOIN user_role ON role_actions.role_uuid = user_role.role_uuid
    WHERE user_role.user_id = ?
  `;

  const actions = await db.exec(sql, [user.id]);
  // transform actions into an array of ids
  session.actions = actions.map(action => action.id);

  // next make sure this user has permissions
  // we use now roles for assigning permissions to users
  sql = `
    SELECT IF(user_role.user_id = ?, 1, 0) authorized, unit.path
    FROM unit
    LEFT JOIN role_unit ON unit.id = role_unit.unit_id
    LEFT JOIN user_role ON user_role.role_uuid = role_unit.role_uuid
    WHERE user_role.user_id = ?
  `;

  const modules = await db.exec(sql, [session.user.id, session.user.id]);

  const isUnauthorized = modules.every(mod => !mod.authorized);

  // if no permissions, notify the user
  if (isUnauthorized) {
    throw new Unauthorized('This user does not have any permissions.');
  }

  session.paths = modules;

  // update the database for when the user logged in
  sql = `
    UPDATE user SET user.active = 1, user.last_login = ? WHERE user.id = ?;
  `;

  await db.exec(sql, [new Date(), session.user.id]);

  // we need to construct the session on the client side, including:
  //   the current enterprise
  //   the current project
  sql = `
    SELECT e.id, e.name, e.abbr, e.phone, e.email, e.address, BUID(e.location_id) as location_id, e.currency_id,
      c.symbol AS currencySymbol, c.name AS currencyName, c.min_monentary_unit, e.po_box, e.helpdesk, e.logo,
      CONCAT_WS(' / ', village.name, sector.name, province.name) AS location
    FROM enterprise AS e
      JOIN currency AS c ON e.currency_id = c.id
      JOIN village ON village.uuid = e.location_id
      JOIN sector ON sector.uuid = village.sector_uuid
      JOIN province ON province.uuid = sector.province_uuid
    WHERE e.id = ?;
  `;

  session.enterprise = await db.one(sql, [user.enterprise_id]);

  sql = `
    SELECT
      *
    FROM enterprise_setting
    WHERE enterprise_id = ?;
  `;
  session.enterprise.settings = await db.one(sql, [session.user.enterprise_id]);

  sql = `
    SELECT
      *
    FROM stock_setting
    WHERE enterprise_id = ?;
  `;

  try {
    session.stock_settings = await db.one(sql, [session.user.enterprise_id]);
  } catch (err) {
    // If the stock_setting table row does not exist, create one with defaults
    await db.exec('INSERT INTO stock_setting SET ?;',
      { enterprise_id : session.user.enterprise_id });
    debug(`Created default stock_setting for enterprise ${session.user.enterprise_id}!`);
    session.stock_settings = await db.one(sql, [session.user.enterprise_id]);
  }

  sql = `
   SELECT p.id, p.name, p.abbr, p.enterprise_id, p.logo
   FROM project AS p WHERE p.id = ?;
  `;
  const projects = await db.exec(sql, [session.user.project_id]);

  if (!projects.length) {
    throw new Unauthorized('No project matching the provided id.');
  }

  [session.project] = projects;

  return session;
}

/**
 * @method reload
 *
 * @description
 * Uses the same login code to reload the permissions for the user.
 */
function reload(req, res, next) {
  if (!(req.session && req.session.user)) {
    next(new Unauthorized('The user is not signed in.'));
    return;
  }

  // refresh the user's session by manually calling refresh session
  loadSessionInformation(req.session.user)
    .then(session => {
      // bind the session  variables
      _.merge(req.session, session);

      // send the session data back to the client
      res.status(200).json(session);
    })
    .catch(next);
}
