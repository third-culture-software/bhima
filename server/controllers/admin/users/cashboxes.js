/**
 * @overview Users/Permissions
 *
 * @description
 * Provides helper functionality to the /users routes.  This file groups all
 * cashboxes-related functionality in the same place.
 *
 * @requires lib/db
 * @requires BadRequest
 */

const db = require('../../../lib/db');
const BadRequest = require('../../../lib/errors/BadRequest');

exports.list = list;
exports.create = create;

/**
 * GET /users/:id/cashboxes
 *
 * Lists all the user cashboxes for user with :id
 */
async function list(req, res) {
  const sql = `
    SELECT cashbox_id FROM cashbox_permission
    WHERE cashbox_permission.user_id = ?;
  `;

  const cashboxes = await db.exec(sql, [req.params.id]);
  const cashboxIds = cashboxes.map(cashbox => cashbox.cashbox_id);
  res.status(200).json(cashboxIds);
}

/**
 * POST /users/:id/cashboxes
 *
 * Creates and updates a user's cashboxes.  This works by completely deleting
 * the user's cashboxes and then replacing them with the new cashboxes set.
 */
async function create(req, res) {
  const transaction = db.transaction();

  // route specific parameters
  const userId = req.params.id;
  const cashboxPermissionIds = req.body.cashboxes;

  if (!userId) {
    throw new BadRequest('You must provide a user ID to update the users cashbox permissions');
  }

  if (!cashboxPermissionIds) {
    throw new BadRequest(
      'You must provide a list of cashbox ids to update the users permissions',
      'ERRORS.BAD_DATA_FORMAT',
    );
  }

  // the request now has enough data to carry out the transaction
  // remove all cashbox permissions for this user
  transaction
    .addQuery('DELETE FROM cashbox_permission WHERE user_id = ?;', [userId]);

  // only insert new cashbox permissions if the provided list contains elements
  if (cashboxPermissionIds.length) {
    // bundle provided permission ids with the userid
    const formattedPermissions = cashboxPermissionIds.map((id) => [id, userId]);

    transaction
      .addQuery('INSERT INTO cashbox_permission (cashbox_id, user_id) VALUES ?', [formattedPermissions]);
  }

  await transaction.execute();
  res.status(201).json({ userId });
}
