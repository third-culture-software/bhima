/**
 * @description
 * This service is responsible for producing PDFs on the server, it accepts
 * handlebar templates and uses the html renderer to produce valid HTML - then
 * streaming this through @ima-worldhealht/coral to produce correctly rendered
 * PDF files.
 *
 * @requires debug
 * @requires lodash
 * @requires @ima-worldhealth/coral
 */

const debug = require('debug')('renderer:pdf');
const _ = require('lodash');
const coral = require('@ima-worldhealth/coral');

const html = require('./html');

const headers = {
  'Content-Type' : 'application/pdf',
};

exports.render = renderPDF;
exports.headers = headers;
exports.extension = '.pdf';

// provide uniform default configurations for reports
const defaultReportOptions = {
  preferCSSPageSize : true,
  showHeaderFooter : true,
  skipRendering : true,
};

exports.defaultReportOptions = defaultReportOptions;

// standard specification for point of sale receipts
exports.posReceiptOptions = {
  width : '72mm',
  height : '290mm',
  margin : {
    left : '0mm',
    right : '0mm',
    bottom : '0mm',
    top : '0mm',
  },
  landscape : false,
};

// smaller format for providing identifications/ receipts with reduced information
exports.reducedCardOptions = {
  width : '75mm', // 2.95in
  height : '125mm', // 4.92.in
  margin : {
    left : '5mm', // 0.20in
    right : '5mm', // 0.20in
    top : '5mm', // 0.20in
    bottom : '5mm', // 0.20in
  },
  landscape : true,
};

/**
 * @function renderPDF
 *
 * @description
 * Takes in a context, template, and options before merging them and making an
 * HTML file out of the result.  The HTML file is passed to coral to render out
 * as a PDF.
 *
 * @param {Object} context    Object of keys and values that will be made available to the handlebar template
 * @param {String} template   Path to a handlebars template
 * @returns {Promise}         Promise resolving in compiled PDF
 */
async function renderPDF(context, template, options = {}) {
  debug('received render request for PDF file. Passing to HTML renderer.');
  _.defaults(options, defaultReportOptions);

  const inlinedHtml = await html.render(context, template, options);

  // pick options relevant to rendering PDFs
  const pdfOptions = _.pick(options, [
    'path', 'format', 'width', 'height', 'margin',
    'headerTemplate', 'footerTemplate', 'pageRanges', 'printBackground',
    'showHeaderFooter', 'preferCSSPageSize', 'orientation',
  ]);

  debug('passing rendered HTML to coral for PDF rendering.');
  const pdf = await coral.render(inlinedHtml.trim(), pdfOptions);

  debug('PDF created with coral.');

  // Convert from Uint8Array to a buffer
  return Buffer.from(pdf);
}
