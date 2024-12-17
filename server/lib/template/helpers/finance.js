const accountingjs = require('accounting-js');
const Handlebars = require('handlebars');
const NumberToText = require('../../NumberToText');

const USD_FMT = { precision : 2 };

const FC_FMT = {
  symbol : 'FC',
  precision : 2,
  thousand : '.',
  decimal : ',',
  format : '%v&nbsp;%s', // value before symbol
};

const EUR_FMT = {
  symbol : '€',
  precision : 2,
  thousand : '&nbsp;', // thin non-breaking space
  decimal : ',',
  format : '%v&nbsp;%s', // value before symbol
};

const FORMATS = [null, FC_FMT, USD_FMT, EUR_FMT]; // NB: Indeces must match currency IDs in database

/** @todo use the currency filter fork written for the client to perform the same behaviour here */
// eslint-disable-next-line default-param-last
function currency(value = 0, currencyId, digit) {
  let output;
  const DEFAULT_CURRENCY_PARAMETERS = 3;
  const fmtNum = Number(currencyId);
  // if currencyId is not defined, defaults to USD.
  const fmt = fmtNum > 0 ? FORMATS[fmtNum] : USD_FMT;

  if (arguments.length === DEFAULT_CURRENCY_PARAMETERS) {
    // default usage of the currency function
    output = new Handlebars.SafeString(accountingjs.formatMoney(value, fmt));
  } else {
    // usage with custom digits for precision
    const format = structuredClone(fmt);

    if (digit !== undefined && (value < 0.01)) { format.precision = digit; }

    output = new Handlebars.SafeString(accountingjs.formatMoney(value, format));
  }

  return output;
}

/**
 * @function currencyWithoutSymbol
 *
 * @description
 * This exists purely to allow the HTML renderer to turn off currency
 * rendering.  It has the same API as the currency helper.
 */
// eslint-disable-next-line
function currencyWithoutSymbol(value = 0, currencyId) {
  return Number(value).toFixed(2);
}

/**
 * @function numberToText
 * @value is the ammount to convert
 * @lang is the selected language
 * @currencyName is the Name of currency
 */
function numberToText(value, lang, currencyName) {
  return NumberToText.convert(value, lang, currencyName);
}

const INDENTATION_STEP = 40;

/**
 * @function indentAccount
 * @description indent with 40px accounts based on the account depth for the chart of accounts
 * @param {number} depth the account number
 * @return {number} number the processed indent
 */
function indentAccount(depth) {
  // indentation step is fixed arbitrary to 40 (40px)
  const number = Number(depth);
  return number ? number * INDENTATION_STEP : 0;
}

function debcred(value = 0, currencyId) {
  let cellClass = '';
  let _value;
  if (value < 0) {
    cellClass = 'text-danger';
    _value = `(${currency(Math.abs(value), currencyId)})`;
  } else {
    _value = `${currency(value, currencyId)}`;
  }

  return new Handlebars.SafeString(`
    <span class="text-right ${cellClass}">${_value}</span>
  `);
}

function percentage(value = 0, decimal = 2) {
  if ((!value && value !== 0) || !Number.isFinite(value) || Number.isNaN(value)) { return ''; }

  const str = (value * 100).toFixed(decimal);
  return `${str}%`;
}

function precision(value = 0, decimal = 2) {
  if (!value || !Number.isFinite(value) || Number.isNaN(value)) { return ''; }
  return new Handlebars.SafeString(value.toFixed(decimal));
}

function lessZero(value = 0) {
  let cellClass = '';

  if (value < 0) {
    cellClass = 'text-danger';
  }

  return new Handlebars.SafeString(`
    <span class="text-right ${cellClass}">${value}</span>
  `);
}

exports.debcred = debcred;
exports.currency = currency;
exports.indentAccount = indentAccount;
exports.numberToText = numberToText;
exports.percentage = percentage;
exports.precision = precision;
exports.currencyWithoutSymbol = currencyWithoutSymbol;
exports.lessZero = lessZero;
