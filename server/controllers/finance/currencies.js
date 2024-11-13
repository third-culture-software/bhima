/**
 * @module Currencies
 *
 * Supports two routes for reading currency information from the database.
 *
 * @requires db
 */

const db = require('../../lib/db');
const fiscal = require('./fiscal');
const exchange = require('./exchange');

exports.lookupCurrencyById = lookupCurrencyById;

function lookupCurrencyById(id) {
  const sql = `
    SELECT c.id, c.name, c.note, c.format_key,
      c.symbol, c.min_monentary_unit
    FROM currency AS c
    WHERE c.id = ?;
  `;

  return db.one(sql, id);
}

/** list currencies in the database */
exports.list = function list(req, res, next) {
  const sql = `
    SELECT currency.id, currency.name, currency.note, currency.format_key,
      currency.symbol, currency.min_monentary_unit, latest_rate.date
    FROM currency left join (select * from exchange_rate group by id order by date asc) as latest_rate
    ON currency.id = latest_rate.currency_id group by currency.id;
  `;

  db.exec(sql)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
};

/** get the details of a single currency */
exports.detail = function detail(req, res, next) {
  lookupCurrencyById(req.params.id)
    .then(row => {
      res.status(200).json(row);
    })
    .catch(next)
    
};

/** get currencies information related to exchange rate */
exports.getExchangeInformationForReports = async (session, params) => {
  const enterpriseId = session.enterprise.id;
  const enterpriseCurrencyId = Number(session.enterprise.currency_id);

  const periods = {
    periodFrom : params.periodFrom,
    periodTo : params.periodTo,
  };

  const range = await fiscal.getDateRangeFromPeriods(periods);
  const exchangeRate = await exchange.getExchangeRate(enterpriseId, params.currency_id, range.dateTo);

  // get information about currencies and exchange rate
  let firstCurrency = enterpriseCurrencyId;
  let secondCurrency = params.currency_id;
  let lastRateUsed = exchangeRate.rate;

  if (lastRateUsed && lastRateUsed < 1) {
    lastRateUsed = (1 / lastRateUsed);
    firstCurrency = params.currency_id;
    secondCurrency = enterpriseCurrencyId;
  }

  return {
    dateFrom : range.dateFrom,
    dateTo : range.dateTo,
    enterpriseId,
    enterpriseCurrencyId,
    firstCurrency : Number(firstCurrency),
    secondCurrency : Number(secondCurrency),
    lastRateUsed,
  };
};
