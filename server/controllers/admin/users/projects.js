/**
 * @overview Users/Projects
 *
 * @description
 * Provides helper functionality to the /users routes.  This file groups all
 * project-related functionality in the same place.
 *
 * @requires lib/db
 */

const db = require('../../../lib/db');

exports.list = list;

/**
 * GET /users/:id/projects
 *
 * Lists all the user project permissions for user with :id
 */
async function list(req, res) {
  const sql = `
    SELECT pp.id, pp.project_id, project.name
    FROM project_permission AS pp JOIN project ON pp.project_id = project.id
    WHERE pp.user_id = ?;
  `;

  const rows = await db.exec(sql, [req.params.id]);
  res.status(200).json(rows);
}
