const satisfaction = require('./satisfaction');

/**
 * Get stock statisfaction rate data
 *
 * GET '/stock/satisfaction_rates'
 *
 * Include query data:  dateFrom, dateTo, depotUuids
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {Promise} for the results
 */
async function satisfactionRates(req, res) {
  const data = await satisfaction.getSatisfactionData(req.query);
  res.status(200).json(data);
}

module.exports = satisfactionRates;
