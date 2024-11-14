/**
 * @overview lib/renderers/xlsxReceipt
 *
 * @description
 * This library is just a shim to ensure API uniformity with other renderers.
 * it renders an Excel receipt(all recepits should follow this template's data structure).
 * Having the same data structure will help to have less xlsx rendereres
 */

const xl = require('excel4node');

const translate = require('../helpers/translate');
const math = require('../template/helpers/math');
const numberToText = require('../NumberToText');

const headers = {
  'Content-Type' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

exports.render = render;
exports.extension = '.xlsx';
exports.headers = headers;

/**
 * @function render
 * @descrption
 * JSON Render Method
 * @param {Object} data - all information needed in the receipt
 * @returns Promise
 */
function render(data) {

  // Create a new instance of a Workbook class
  const wb = new xl.Workbook();

  // Add Worksheets to the workbook
  const ws = wb.addWorksheet('Sheet 1');

  // Create a reusable style
  // bold,hightlighted

  const bold = wb.createStyle({
    font : {
      color : '#000000',
      size : 12,
      bold : true,
    },
  });
  // normal style
  const normal = wb.createStyle({
    font : {
      color : '#000000',
      size : 11,
    },
  });

  const styleMultiLine = {
    alignment : {
      wrapText : true,
    },
  };
  const borderInfo = {
    style : 'thin',
    color : '#000000',
  };

  const styleBorderTop = {
    border : {
      top : borderInfo,
    },
  };
  const styleBorderRight = {
    border : {
      right : borderInfo,
    },
  };
  const styleUndeLine = {
    font : {
      color : '#000000',
      size : 12,
      underline : true,
    },
  };
  const styleAllBorders = {
    border : {
      bottom : borderInfo,
      left : borderInfo,
      top : borderInfo,
      right : borderInfo,
    },
  };
  const styleBorderBottom = {
    border : {
      bottom : borderInfo,
    },
  };

  const styleBorderLeft = {
    border : {
      left : borderInfo,
    },
  };

  // use translate lib for translating labels
  const t = translate(data.lang);
  const { currencySymbol, currencyName } = data.enterprise;

  // let specify information for each excel cell

  // Header's informations
  // cell merge , cell(1,1) =A1; cell(1,3) = C1
  ws.cell(1, 1, 1, 3, true).string(data.enterprise.name).style(bold);
  ws.cell(2, 1, 2, 3, true).string(t('FORM.LABELS.ADDRESS').concat(': ', data.enterprise.location)).style(normal);
  ws.cell(3, 1, 3, 3, true).string(t('FORM.LABELS.PHONE').concat(': ', data.enterprise.phone)).style(normal);
  ws.cell(4, 1, 4, 3, true).string(t('FORM.LABELS.EMAIL').concat(': ', data.enterprise.email)).style(normal);

  // cell(1,6)=> F1
  ws.cell(1, 6).string(t('FORM.LABELS.INVOICE')).style(bold);
  ws.cell(2, 6).string(data.reference).style(bold);
  ws.cell(3, 6).string(data.dateFormat).style(normal);

  // cell(7, 1) => A7
  ws.cell(7, 1, 7, 3, true).string(t('FORM.LABELS.CLIENT').concat(': ', data.recipient.reference));
  ws.cell(8, 1, 8, 3, true).string(t('FORM.LABELS.NAME').concat(': ', data.recipient.display_name));
  ws.cell(9, 1, 9, 3, true).string(t('FORM.LABELS.GROUP').concat(': ', data.recipient.debtor_group_name));
  ws.cell(10, 1, 10, 3, true).string(t('FORM.LABELS.HOSPITAL_FILE_NR').concat(': ', data.recipient.hospital_no));

  ws.cell(7, 5, 7, 7, true).string(t('FORM.LABELS.INVOICE').concat(': ', data.reference));
  ws.cell(8, 5, 8, 7, true).string(t('TABLE.COLUMNS.SERVICE').concat(': ', data.serviceName));
  ws.cell(9, 5, 9, 7, true).string(t('FORM.LABELS.DATE').concat(': ', data.dateFormat));
  ws.cell(10, 5, 10, 7, true).string(t('FORM.LABELS.CREATED_BY').concat(': ', data.display_name));

  ws.cell(7, 1, 10, 7).style(normal);

  ws.cell(7, 1, 7, 7).style(styleBorderTop);

  ws.cell(10, 1, 10, 7).style(styleBorderBottom);
  ws.cell(7, 1, 10, 1).style(styleBorderLeft);
  ws.cell(7, 7, 10, 7).style(styleBorderRight);

  // Description

  ws.cell(12, 1).string(t('FORM.LABELS.DESCRIPTION')).style(styleUndeLine);
  ws.cell(13, 1, 13, 7, true).string(data.description).style(normal);
  ws.cell(13, 1, 13, 7, true).style(styleMultiLine);
  ws.row(13).setHeight(40); // description might be pretty long

  // invoice details
  ws.cell(15, 1).string(t('FORM.LABELS.INVOICES_DETAILS')).style(styleUndeLine);

  // titles
  let line = 16;
  ws.cell(line, 1).string(t('TABLE.COLUMNS.CODE'));
  ws.cell(line, 2, line, 4, true).string(t('TABLE.COLUMNS.DESCRIPTION'));
  ws.cell(line, 5).string(t('TABLE.COLUMNS.UNIT_PRICE'));
  ws.cell(line, 6).string(t('TABLE.COLUMNS.QUANTITY'));
  ws.cell(line, 7).string(t('TABLE.COLUMNS.TOTAL'));
  ws.cell(line, 1, line, 7).style(normal);
  ws.cell(line, 1, line, 7).style(styleAllBorders);

  line = 17;
  // invoice items
  data.items.forEach(row => {
    ws.cell(line, 1).string(row.code);
    ws.cell(line, 2, line, 4, true).string(row.text);
    ws.cell(line, 5).number(row.transaction_price);
    ws.cell(line, 6).number(row.quantity);

    const total = (row.transaction_price * row.quantity);
    ws.cell(line, 7).string(''.concat(total, '', currencySymbol));

    ws.cell(line, 1, line, 7).style(normal);
    ws.cell(line, 1, line, 7).style(styleAllBorders);
    line++;
  });

  // subsidy

  if (data.subsidy.length) {
    const subsidyLabel = t('FORM.LABELS.SUBSIDIES').concat('(', data.subsidy.length, ')');
    ws.cell(line, 3, line, 4, true).string(subsidyLabel).style(normal);
    ws.cell(line, 5, line, 7, true).number(math.sum(data.subsidy, 'value')).style(bold);
    ws.cell(line, 3, line, 7, true).style(styleAllBorders);
  }

  // Total
  line++;
  ws.cell(line, 3, line, 4, true).string(t('FORM.LABELS.TOTAL')).style(bold);
  ws.cell(line, 5, line, 7, true).number(data.cost).style(bold);
  ws.cell(line, 3, line, 7, true).style(styleAllBorders);
  line++;

  ws.cell(line, 3, line, 7, true).string(numberToText.convert(data.cost, data.lang, currencyName)).style(bold);
  ws.cell(line, 3, line, 7, true).style(styleAllBorders);
  line++;

  return wb.writeToBuffer();
}
