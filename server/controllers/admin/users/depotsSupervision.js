/**
 * @overview Users/Permissions
 *
 * @description
 * Provides helper functionality to the /users routes.  This file groups all
 * depots-related functionality in the same place.
 *
 * @requires lib/db
 */

const db = require('../../../lib/db');

exports.list = list;
exports.create = create;

/**
 * GET /users/:id/depots
 *
 * Lists all the user depots supervision for user with :id
 */
async function list(req, res) {
  const sql = `
    SELECT BUID(depot_supervision.depot_uuid) AS depot_uuid FROM depot_supervision
    WHERE depot_supervision.user_id = ?;
  `;

  const rows = await db.exec(sql, [req.params.id]);
  const data = rows.map(row => row.depot_uuid);
  res.status(200).json(data);

}

/**
 * POST /users/:id/depots
 *
 * Creates and updates a user's depots for supervision.  This works by completely deleting
 * the user's depots and then replacing them with the new depots set.
 */
async function create(req, res) {
  const transaction = db.transaction();

  transaction
    .addQuery('DELETE FROM depot_supervision WHERE user_id = ?;', [req.params.id]);

  // if an array of permission has been sent, add them to an INSERT query
  const depots = req.body.depots || [];

  if (depots.length) {
    const data = [].concat(depots).map((uuid) => {
      return [db.bid(uuid), req.params.id];
    });

    transaction
      .addQuery('INSERT INTO depot_supervision (depot_uuid, user_id) VALUES ?', [data]);
  }

  await transaction.execute();
  res.sendStatus(201);
}
