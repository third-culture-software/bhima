/**
 * Multiple Payroll Controller
 *
 * @description
 * This controller is responsible for implementing all operation on the
 * payment table through the `/multiple_payroll` endpoint.
 * The /multiple_payroll HTTP API endpoint
 *
 *
 * @requires db
 */

const { find } = require('./find');
const { getConfigurationData } = require('./getConfig');
const manageConfig = require('./manageConfig');

const setMultiConfiguration = require('./setMultiConfiguration');
const setConfiguration = require('./setConfiguration');
const makeCommitment = require('./makeCommitment');

/**
 * @method search
 * @description search Payroll payments
 */
function search(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);
}

// TODO(@jniles) - this currently recueives the payrollConfigurationId and
// the start and end dates of the payment period.  Rather than use start and end dates of
// the payment period, we should instead send back the payment period id, and use that
// to query what the start and end dates should be.
function configuration(req, res, next) {
  const params = req.query;
  const payrollConfigurationId = req.params.id;

  getConfigurationData(payrollConfigurationId, params)
    .then((rows) => {
      const dataManaged = manageConfig.manageConfigurationData(rows, params);
      res.status(200).json(dataManaged);
    })
    .catch(next);
}

// search Payroll Paiement
exports.search = search;

// get Payroll Rubric Configured
exports.configuration = configuration;

// Set Configuration
exports.setConfiguration = setConfiguration;

// Export function find for Multiple Payroll Report
exports.find = find;

// Put Employees on the Payment Agreement List
// Transfer of the entries in accountants for the commitment of payment
exports.makeCommitment = makeCommitment;

// Set Multi Configuration
exports.setMultiConfiguration = setMultiConfiguration;
