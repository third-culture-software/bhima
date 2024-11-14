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
function list(req, res, next) {
  const sql = `
    SELECT cashbox_id FROM cashbox_permission
    WHERE cashbox_permission.user_id = ?;
  `;

  db.exec(sql, [req.params.id])
    .then((cashboxes) => {
      const cashboxIds = cashboxes.map(cashbox => cashbox.cashbox_id);

      res.status(200).json(cashboxIds);
    })
    .catch(next);

}

/**
 * POST /users/:id/cashboxes
 *
 * Creates and updates a user's cashboxes.  This works by completely deleting
 * the user's cashboxes and then replacing them with the new cashboxes set.
 */
function create(req, res, next) {
  const transaction = db.transaction();

  // route specific parameters
  const userId = req.params.id;
  const cashboxPermissionIds = req.body.cashboxes;

  if (!userId) {
    next(new BadRequest('You must provide a user ID to update the users cashbox permissions'));
    return;
  }

  if (!cashboxPermissionIds) {
    next(new BadRequest(
      'You must provide a list of cashbox ids to update the users permissions',
      'ERRORS.BAD_DATA_FORMAT',
    ));
    return;
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

  transaction.execute()
    .then(() => {
      res.status(201).json({ userId });
    })
    .catch(next);

}
