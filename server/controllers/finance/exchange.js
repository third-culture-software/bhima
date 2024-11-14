/**
 * Exchange Rate Controller
 *
 * This controller exposes an API to the client for reading and writing exchange
 * rates.
 */

const db = require('../../lib/db');
const util = require('../../lib/util');
const NotFound = require('../../lib/errors/NotFound');

exports.getExchangeRate = getExchangeRate;
exports.formatExchangeRateForDisplay = formatExchangeRateForDisplay;
exports.getCurrentExchangeRateByCurrency = getCurrentExchangeRateByCurrency;

// uses the mysql function getExchangeRate() to find
// the correct exchange rate
function getExchangeRate(enterpriseId, currencyId, date) {
  const sql = 'SELECT GetExchangeRate(?, ?, ?) AS rate;';

  return db.exec(sql, [enterpriseId, currencyId, new Date(date)])
    .then(rows => rows[0]);
}

// gets a non-fractional number for the exchange rate display.
function formatExchangeRateForDisplay(value) {
  return (value < 1) ? util.roundDecimal(1 / value, 2) : value;
}

/**
 * @method list
 *
 * @description
 * This function lists all exchange rates in the database tied to
 * the session enterprises.
 *
 * URL: /exchange
 */
exports.list = function list(req, res, next) {
  const { enterprise } = req.session;
  const options = { ...req.query, ...req.params };

  getExchangeRateList(enterprise.id, options)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next);

};

/**
 * @function getExchangeRateList
 * @private
 *
 * @description
 * Returns the list of exchange rates tied to a particular enterprise.
 */
function getExchangeRateList(enterpriseId, opts) {
  const options = opts || {};

  const limit = Number(options.limit);
  const limitQuery = Number.isNaN(limit) ? '' : `LIMIT ${limit}`;
  const whereQuery = options.id ? `AND exchange_rate.id = ${options.id}` : '';

  const sql = `
    SELECT exchange_rate.id, exchange_rate.enterprise_id, exchange_rate.currency_id,
    exchange_rate.rate, exchange_rate.date, enterprise.currency_id AS 'enterprise_currency_id'
    FROM exchange_rate
    JOIN enterprise ON enterprise.id = exchange_rate.enterprise_id
    WHERE exchange_rate.enterprise_id = ? ${whereQuery}
    ORDER BY date DESC
    ${limitQuery};
  `;
  return db.exec(sql, [enterpriseId]);
}

// POST /exchange
exports.create = function create(req, res, next) {
  const data = req.body.rate;

  // pre-process dates for mysql insertion
  if (data.date) {
    data.date = new Date(data.date);
  }

  const sql = `INSERT INTO exchange_rate (enterprise_id, currency_id, rate, date)
    VALUES (?);`;

  db.exec(sql, [[data.enterprise_id, data.currency_id, data.rate, data.date]])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

};

// PUT /exchange/:id
exports.update = function update(req, res, next) {
  let sql = 'UPDATE exchange_rate SET ? WHERE id = ?;';
  const notFoundErrorMessage = `Could not find an exchange rate with id ${req.params.id}`;
  // should we even be changed the date?
  if (req.body.date) {
    req.body.date = new Date(req.body.date);
  }
  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      sql = `SELECT
        exchange_rate.id, exchange_rate.enterprise_id, exchange_rate.currency_id,
        exchange_rate.rate, exchange_rate.date, enterprise.currency_id AS enterprise_currency_id
      FROM exchange_rate
      JOIN enterprise ON enterprise.id = exchange_rate.enterprise_id
      WHERE exchange_rate.id = ?;`;

      return db.exec(sql, [req.params.id]);
    })
    .then((rows) => {
      if (rows.length === 0) {
        throw new NotFound(notFoundErrorMessage);
      }
      res.status(200).json(rows[0]);
    })
    .catch((e) => {
      if (e.code === 'ER_TRUNCATED_WRONG_VALUE') {
        throw new NotFound(notFoundErrorMessage);
      } else {
        throw e;
      }
    })
    .catch(next);

};

// DELETE /exchange/:id
exports.delete = function del(req, res, next) {
  db.delete(
    'exchange_rate', 'id', req.params.id, res, next, `Could not find an exchange rate with id ${req.params.id}`,
  );
};

// This query returns the current exchange rate of all currencies
function getCurrentExchangeRateByCurrency(date = new Date()) {
  const sql = `
    SELECT e.currency_id, e.id, e.enterprise_id, MAX(e.rate) rate, e.date
      FROM (
        SELECT exchange_rate.currency_id, exchange_rate.id, exchange_rate.enterprise_id,
        exchange_rate.rate, exchange_rate.date
        FROM exchange_rate
        JOIN (
        SELECT exchange_rate.currency_id, MAX(exchange_rate.date) AS exchangeDate
        FROM exchange_rate
        WHERE exchange_rate.date <= DATE(?)
        GROUP BY exchange_rate.currency_id
        ) AS lastExchange
        ON exchange_rate.currency_id = lastExchange.currency_id AND exchange_rate.date = lastExchange.exchangeDate
        WHERE exchange_rate.date <= DATE(?)
        ORDER BY exchange_rate.rate DESC
      ) AS e
    GROUP BY e.currency_id;
  `;

  return db.exec(sql, [date, date]);
}
