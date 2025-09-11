/**
 * @overview lib/renderers/xlsx
 *
 * @description
 * This library is just a shim to ensure API uniformity with other renderers.
 * it renders an Excel report(from data.rows that we pass as render function param).
 * Having the same data structure will help to have less xlsx renderers
 * @module lib/renderers/xlsx
 *
 * @requires excel4node
 * @requires lodash
 */
const xl = require('excel4node');
const _ = require('lodash');

const { isDate } = require('../util');
const i18n = require('../helpers/translate');

const headers = {
  'Content-Type' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const IGNORED_COLUMNS = [
  'uuid', 'invoice_uuid', 'entity_uuid', 'reference_uuid', 'record_uuid', 'debtor_uuid',
  'location_uuid', 'document_uuid',
];

exports.render = render;
exports.find = find;
exports.extension = '.xlsx';
exports.headers = headers;
exports.setValue = setValue;
exports.IGNORED_COLUMNS = IGNORED_COLUMNS;

/**
 * XLSX Render Method
 *
 * @function render
 *
 * @description
 * Renders the dataset as an XLSX file
 *
 * @param {Object} data   { rows : []}
 */
function render(data, template, options) {
  // create a new instance of a Workbook class
  const wb = new xl.Workbook();

  // get a translated worksheet name
  const worksheetName = i18n(options.lang)(options.filename);

  // style applied to cells
  const headerStyle = wb.createStyle({
    font : {
      color : '#ffffff',
      size : 12,
      bold : true,
    },
    fill : {
      type : 'pattern',
      patternType : 'solid',
      fgColor : '2384F5',
    },
  });

  const normalFontSize = {
    font : {
      size : 10,
    },
  };

  const borderInfo = {
    style : 'thin',
    color : '#000000',
  };

  const styleAllBorders = {
    border : {
      bottom : borderInfo,
      left : borderInfo,
      top : borderInfo,
      right : borderInfo,
    },
  };

  // Add worksheets to the workbook
  const ws = wb.addWorksheet(worksheetName);
  const rows = find(data, options); // get all rows to set in the sheet
  const firstObject = rows[0] || {};

  // writing columns
  const firstLineCols = Object.keys(firstObject);

  // tracks the index in the sheet
  let line = 1;

  firstLineCols.forEach((key, index) => {
    ws.cell(line, index + 1)
      .string(key)
      .style(headerStyle)
      .style(styleAllBorders);
  });

  line++;

  // writing rows
  rows.forEach((row) => {
    firstLineCols.forEach((key, index) => {
      setValue(ws, line, index + 1, row[key] || '')
        .style(styleAllBorders)
        .style(normalFontSize);
    });
    line++;
  });

  return wb.writeToBuffer();
}

/**
 * @function find
 *
 * @description
 * Finds available data to write in the excel file rows is the default key.
 * If nothing is found, this function get look at rowsDataKey it return
 * an empty array if no data found.
 */
function find(data, options = {}) {
  const dataset = data.rows || data[options.rowsDataKey] || [];

  // combine custom "ignoredColumns" with default ignored columns
  const mask = IGNORED_COLUMNS.concat(options.ignoredColumns || []);

  // mask the dataset using lodash and return it
  return dataset.map(row => _.omit(row, mask));
}

// set value to a paticular cell
function setValue(ws, x, y, value) {
  const cell = ws.cell(x, y);

  if (_.isNumber(value)) {
    return cell.number(value);
  }

  const isValidDate = isDate(value) && !Number.isNaN(value.valueOf());

  if (isValidDate) {
    return cell.date(value).style({
      numberFormat : 'yyyy-mm-dd hh:mm:ss',
    });
  }

  if (_.isBoolean(value)) {
    const _value = value ? 1 : 0;
    return cell.number(_value);
  }

  return cell.string(value || '');
}
