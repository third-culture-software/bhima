const db = require('../lib/db');
const BadRequest = require('../lib/errors/BadRequest');

const subscriptions = {
  debtor_group_invoicing_fee : {
    entity : 'debtor_group_uuid',
    map : 'invoicing_fee_id',
  },
  debtor_group_subsidy : {
    entity : 'debtor_group_uuid',
    map : 'subsidy_id',
  },
};

exports.updateSubscriptions = updateSubscriptions;

prepareQueries();

/**
 * @function updateSubscriptions
 *
 * @description
 * :key - subscription relationship table
 * :id - UUID of entity to update subscriptions for
 */
async function updateSubscriptions(req, res) {
  const { id, key : subscriptionKey } = req.params;
  const subscriptionDetails = subscriptions[subscriptionKey];
  const groupSubscriptions = req.body.subscriptions;

  if (!subscriptionDetails) {
    throw new BadRequest(
      `Cannot find details for ${subscriptionKey} subscription`,
      'ERROR.INVALID_REQUEST',
    );
  }
  if (!groupSubscriptions) {
    throw new BadRequest(
      `Request must specify a "subscriptions" object containing an array of entity ids`,
      'ERROR.ERR_MISSING_INFO',
    );
  }

  const transaction = db.transaction();
  const binaryId = db.bid(id);
  const formattedSubscriptions = parseFromMap(groupSubscriptions, binaryId);

  // Remove all relationships for the entity ID provided
  transaction.addQuery(subscriptionDetails.deleteAssignmentsQuery, [binaryId]);

  // Add relationships for all subscription IDs specified
  if (formattedSubscriptions.length) {
    transaction.addQuery(subscriptionDetails.createAssignmentsQuery, [formattedSubscriptions]);
  }

  const result = await transaction.execute();
  res.status(200).json(result);
}

/**
 * @function prepareQueries
 *
 * @description
 * Creates prepared SQL statements for each subscription type.
 */
function prepareQueries() {
  // eslint-disable-next-line
  for (const [key, subscription] of Object.entries(subscriptions)) {
    subscription.deleteAssignmentsQuery = `DELETE FROM ${key} WHERE ${subscription.entity} = ?`;
    subscription.createAssignmentsQuery = `INSERT INTO ${key} (${subscription.entity}, ${subscription.map}) VALUES ?`;
  }
}

/**
 * @function parseFromMap
 *
 * @description
 * Converts a form submission object into an array for SQL insertion.
 */
function parseFromMap(groupSubscriptions, entityId) {
  return Object.entries(groupSubscriptions)
    .filter(([, isSubscribed]) => isSubscribed)
    .map(([key]) => [entityId, key]);
}
