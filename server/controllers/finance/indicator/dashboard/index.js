/**
 * indicators dashboard
 */
const moment = require('moment');
const process = require('./process');

exports.getIndicators = getIndicators;
async function getIndicators(req, res) {
  const options = req.query;
  const rows = await lookupIndicators(options);
  res.status(200).json(rows);
}

async function lookupIndicators(options) {
  options.dateFrom = moment(options.dateFrom).format('YYYY-MM-DD');
  options.dateTo = moment(options.dateTo).format('YYYY-MM-DD');
  return process.processIndicators(options);
}
