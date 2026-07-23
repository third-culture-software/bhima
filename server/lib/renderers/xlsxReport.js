/**
 * @file lib/renderers/xlsx
 * @description
 * This library is just a shim to ensure API uniformity with other renderers.
 * it renders an Excel report(from data.rows that we pass as render function param).
 * Having the same data structure will help to have less xlsx renderers
 * @module lib/renderers/xlsx
 * @requires excel4node
 */
const xl = require('excel4node');
const { find, headers, setValue } = require('./xlsx');

const i18n = require('../helpers/translate');

exports.render = render;
exports.find = find;
exports.extension = '.xlsx';
exports.headers = headers;

/**
 * XLSX Render Method
 * @function render
 * @description
 * Renders the dataset as an XLSX file
 * @param {object} data   { rows : []}
 * @param filename
 * @param {object} options { metadata }
 */
function render(data, filename, options) {

  // create a new instance of a Workbook class
  const wb = new xl.Workbook();

  // get a translated worksheet name
  const worksheetName = t(filename || 'Sheet1');

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
  const center = {
    alignment : {
      horizontal : ['center'],
    },
  };
  const right = {
    alignment : {
      horizontal : ['right'],
    },
  };

  const titleStyle = {
    font : {
      color : '#000000',
      size : 16,
      bold : true,
    },
  };

  /*
  * Translate
  */
  /**
   *
   * @param label
   */
  function t(label) {
    return i18n(options.lang)(label);
  }

  // Add worksheets to the workbook

  const ws = wb.addWorksheet(worksheetName);
  const rows = find(data, options); // get all rows to set in the sheet

  let { title, subtitle } = options;
  title = t(title || filename || '');
  subtitle = t(subtitle || '');

  const { metadata } = data;

  ws.cell(1, 1, 1, 4, true).string(metadata.enterprise.name);
  ws.cell(2, 1, 2, 4, true).string(`${metadata.project.name}(${metadata.project.abbr})`);
  ws.cell(3, 1, 3, 4, true).string(`${t('FORM.LABELS.ADDRESS')}: ${metadata.enterprise.location}`);
  ws.cell(4, 1, 4, 4, true).string(`${t('FORM.LABELS.PHONE')}: ${metadata.enterprise.phone}`);
  ws.cell(5, 1, 5, 4, true).string(`${t('FORM.LABELS.EMAIL')}: ${metadata.enterprise.email}`);

  ws.cell(1, 9).string(`${t('REPORT.PRODUCED_ON')}`).style(right);
  ws.cell(1, 10).date(metadata.timestamp).style({
    numberFormat : 'dd/mm/yyyy',
  });

  ws.cell(2, 9).string(`${t('REPORT.BY')}`).style(right);
  ws.cell(2, 10).string(metadata.user.display_name).style(right);

  ws.cell(6, 3, 6, 9, true).string(title).style(titleStyle).style(center);
  ws.cell(7, 3, 7, 9, true).string(subtitle).style(center);

  const firstObject = rows[0] || {};

  // writing columns
  const firstLineCols = Object.keys(firstObject);

  // tracks the index in the sheet
  let line = 9;

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
      let val = row[key];

      if (key.indexOf('date_') !== -1) {
        val = new Date(row[key]);
      }

      setValue(ws, line, index + 1, val || '')
        .style(styleAllBorders)
        .style(normalFontSize);
    });
    line++;
  });

  return wb.writeToBuffer();
}
