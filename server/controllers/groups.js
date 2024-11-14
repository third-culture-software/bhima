const _ = require('lodash');

const db = require('../lib/db');
const BadRequest = require('../lib/errors/BadRequest');

let subscriptions = {
  debtor_group_invoicing_fee : {
    entity  : 'debtor_group_uuid',
    map     : 'invoicing_fee_id',
  },
  debtor_group_subsidy : {
    entity : 'debtor_group_uuid',
    map : 'subsidy_id ',
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
function updateSubscriptions(req, res, next) {
  // TODO remove the concept of ids or uuids on linking tables
  const { id } = req.params;
  const subscriptionKey = req.params.key;
  const subscriptionDetails = subscriptions[subscriptionKey];
  const groupSubscriptions = req.body.subscriptions;

  if (!subscriptionDetails) {
    throw new BadRequest(`Cannot find details for ${subscriptionKey} subscription`, 'ERROR.INVALID_REQUEST');
  }
  if (!groupSubscriptions) {
    throw new BadRequest(
      `Request must specify a "subscriptions" object containing an array of entity ids`,
      `ERROR.ERR_MISSING_INFO`,
    );
  }

  const transaction = db.transaction();
  const binaryId = db.bid(id);
  const formattedSubscriptions = parseFormMap(groupSubscriptions, binaryId);

  // remove all relationships for the entity ID provided
  transaction.addQuery(subscriptionDetails.deleteAssignmentsQuery, [binaryId]);

  // add relationships for all subscription IDs specified
  if (formattedSubscriptions.length) {
    transaction.addQuery(subscriptionDetails.createAssignmentsQuery, [formattedSubscriptions]);
  }

  transaction.execute()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);

}

/**
 * @function prepareQueries
 *
 * @description
 * This method is run once on server startup.
 * Iterate through all valid server subscriptions and template in table names
 * and entity ids - these prepared statements can then be run to update subscriptions
 */
function prepareQueries() {
  // accept a subscription definition object and append two attributes
  // * deleteAssignmentsQuery - remove all assignements with this entity
  // * createAssigmentsQuery - insert assignments into table name
  subscriptions = _.mapValues(subscriptions, (subscription, key) => {
    subscription.deleteAssignmentsQuery = `DELETE FROM ${key} WHERE ${subscription.entity} = ?`;
    subscription.createAssignmentsQuery = `INSERT INTO ${key} (${subscription.entity}, ${subscription.map}) VALUES ?`;
    return subscription;
  });

  return subscriptions;
}

/**
 * @function parseFormMap
 *
 * @description
 * This method parses an object directly sent from a clients form elements. It
 * converts an object key : value map into an array that can be inserted using
 * the INSERT INTO VALUES ? syntax
 *
 * @example
 * {
 *  '1' : true,
 *  '2' : false,
 *  '3' : true
 * }
 *
 * returns
 *
 * [
 *  [${subscription_uuid}, 1],
 *  [${subscription_uuid}, 3]
 * ]
 */
function parseFormMap(groupSubscriptions, entityId) {
  return _.chain(groupSubscriptions)
    .pickBy(isGroupSubscribed => isGroupSubscribed)
    .map((isGroupSubscribed, key) => [entityId, key])
    .value();
}
