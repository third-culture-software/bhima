/**
 * @file lib/renderers/csv
 * @description
 * This library is used to render CSV data from UI-Grids.  The user experience
 * will be similar to using the print to pdf renderers, except it will allow
 * downloading as a comma separated file to the client.
 * @requires csv
 * @requires moment
 * @requires debug
 */

const { stringify } = require('csv/sync');
const moment = require('moment');
const debug = require('debug')('renderer:csv');
const { isDate } = require('../util');

// @TODO discuss if this should be moved into its own library
const DATE_FORMAT = 'DD/MM/YYYY H:mm:s';

const headers = {
  'Content-Type' : 'text/csv',
};

// CSV rendering defaults
const defaults = {
  trimHeaderFields : true,
};

const ID_KEYWORDS = ['_id', 'uuid'];

// this field will tell the csv renderer what to render
const DEFAULT_DATA_KEY = 'csv';

exports.extension = '.csv';
exports.render = renderCSV;
exports.headers = headers;

/**
 * Render a csv file`
 * @param {object} data - Object of keys/values for the data
 * @param {string} template - Path to a handlebars template
 * @param {object} options - The default options to be extended and passed to renderer
 * @returns {Promise} Promise resolving in a rendered dataset (CSV)
 */
function renderCSV(data, template, options = {}) {

  // allow different server routes to pass in csvOptions
  const csvOptions = { ...defaults, ...options.csvOptions };

  let csvData = data[options.csvKey || DEFAULT_DATA_KEY];

  debug(`processing a CSV of ${csvData.length} rows.`);

  if (!options.suppressDefaultFormatting) {
    debug('applying default date formatting.');
    csvData = csvData.map(dateFormatter);
  }

  if (!options.suppressDefaultFiltering) {
    // row based filters
    csvData = csvData.map(idFilter);

    // data set based filters
    csvData = emptyFilter(csvData);
    debug('applying default row filtering.');
  }

  
  if (csvOptions.trimHeaderFields) {
    debug('trimming header fields.');
    csvData = csvData.map(trimKeys);
  }

  // ensure every row shares the same columns so csv-stringify's header
  // inference (based on the first row) doesn't drop columns that only
  // appear later in the dataset
  csvData = normalizeColumns(csvData);


  // translate legacy json-2-csv options into csv (csv-stringify) options
  const stringifyOptions = {
    header : true,
    // Force addition of the excel BOM to enable the output file to be treated
    // as UTF-8 so language-specific UTF-8 characters, accents, etc, are retained
    bom : true,
    eof : false,
    cast : {
      date : (value) => value.toISOString(),
    },
    ...csvOptions.stringifyOptions,
  };

  // render the data array as csv; wrapped in a Promise to preserve the
  // async contract that renderCSV previously exposed via json-2-csv
  try {
    const csvString = stringify(csvData, stringifyOptions);
    return Promise.resolve(csvString);
  } catch (error) {
    return Promise.reject(error);
  }
}

// converts a value to a date string if it is a date
const convertIfDate = (csvValue) => {
  if (isDate(csvValue)) {
    return moment(csvValue).format(DATE_FORMAT);
  }

  return csvValue;
};

/**
 * @param csvRow
 * @function dateFormatter
 * @description
 * Accepts an object of key/value pairs. Returns the same object with all values
 * that are dates converted to a standard format.
 */
function dateFormatter(csvRow) {
  return Object.fromEntries(
    Object.entries(csvRow).map(([key, value]) => [key, convertIfDate(value)])
  );
}

/**
 * @param columnName
 * @function containsIdKeyword
 * @private
 * @description
 * Accepts in a columnName and returns true if it is included in the
 * list of reserved identifiers
 */
function containsIdKeyword(columnName) {
  return ID_KEYWORDS.some((keyword) => columnName.includes(keyword));
}

/**
 * @param csvRow
 * @function idFilter
 * @description
 * Accepts an object of key/ value pairs. Returns a manipulated object, removing
 * all columns that match a pre-defined list of keywords
 */
function idFilter(csvRow) {
  const invalidColumns = Object.keys(csvRow).filter(containsIdKeyword);

  invalidColumns.forEach((columnName) => delete csvRow[columnName]);
  return csvRow;
}

/**
 * @param csvRow
 * @function trimKeys
 * @description
 * Accepts an object of key/value pairs. Returns a new object with all keys
 * (header/column names) trimmed of leading/trailing whitespace. This replaces
 * json-2-csv's `trimHeaderFields` option, since csv-stringify has no built-in
 * equivalent.
 */
function trimKeys(csvRow) {
  const mapKeys = (object, cb) => Object.entries(object)
    .reduce((acc, current) => {
      const newKey = cb(current[1], current[0], object);
      acc[newKey] = current[1];
      return acc;
    }, {});

  return mapKeys(csvRow, (value, key) => key.trim());
}

/**
 *
 * @param v
 */
function isNil(v) {
  return v === null || v === undefined;
}

const isEmpty = obj => [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length;

/**
 * @param csvData
 * @function emptyFilter
 * @description
 * Accepts an array of CSV object rows. This method removes attributes from each
 * row if that attribute is NULL for every value in the array.
 */
function emptyFilter(csvData) {
  if (isEmpty(csvData)) { return []; }

  const firstElement = csvData[0];

  // assumes all rows have exactly the same columns
  const invalidColumns = Object.keys(firstElement).filter(columnIsEmpty);

  /**
   *
   * @param columnName
   */
  function columnIsEmpty(columnName) {
    // this will return true as soon as any of the values in the rows are not NULL
    // if it returns true we return false (!true) to ensure this row is kept
    return !csvData.some((csvRow) => !isNil(csvRow[columnName]));
  }

  return csvData.map((csvRow) => {
    invalidColumns.forEach((columnName) => delete csvRow[columnName]);
    return csvRow;
  });
}

/**
 * @param csvData
 * @function normalizeColumns
 * @description
 * Ensures every row has every column seen across the whole dataset (in
 * first-seen order), so csv-stringify's header inference (which only looks
 * at the first row) doesn't silently drop columns that are missing on row 1
 * but present later. Missing/undefined values are rendered as the literal
 * string 'undefined' to preserve legacy json-2-csv output.
 */
function normalizeColumns(csvData) {
  const allKeys = [];
  const seen = new Set();

  csvData.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        allKeys.push(key);
      }
    });
  });

  return csvData.map((row) => {
    const normalized = {};
    allKeys.forEach((key) => {
      const hasKey = Object.prototype.hasOwnProperty.call(row, key);
      normalized[key] = hasKey && row[key] !== undefined ? row[key] : 'undefined';
    });
    return normalized;
  });
}

