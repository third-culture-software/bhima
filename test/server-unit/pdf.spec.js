/* eslint global-require: "off" */
const { expect } = require('chai');
const rewire = require('rewire');
const path = require('path');
const fs = require('fs').promises;

/**
 * Mock an HTML renderer without the complexity of BHIMA's bundle one
 */
const mockHTMLRenderer = (data, template) => {
  // eslint-disable-next-line
  const compiled = require('handlebars').compile(template);
  return Promise.resolve(compiled(data));
};

const nodeModulesPath = path.resolve(__dirname, '../../', 'node_modules');

const pdf = rewire('../../server/lib/renderers/pdf');
pdf.__set__('html', { render : mockHTMLRenderer });

// mock handlebars template file
const template = 'test/fixtures/file.handlebars';
const templateWithBarcode = 'pdf-template-with-barcode.handlebars';

// mock data
const data = {
  developer : 'developer',
  message : 'You are a tourist :-)',
  developer_message : 'You are a developer',
  lang : 'fr',
};

const fixturesPath = path.resolve('test/fixtures');

describe('test/server-unit/pdf', function () { // eslint-disable-line
  this.timeout(5000);

  it('#pdf.render() renders a valid PDF file', async () => {

    const htmlString = await fs.readFile(template, 'utf8');
    const result = await pdf.render(data, htmlString, {});
    const hasValidVersion = hasValidPdfVersion(result.toString());
    const isBuffer = isBufferInstance(result);
    expect(isBuffer && hasValidVersion).to.be.equal(true);
  });

  it('#pdf.render() templates in a barcode to the pdf file', async () => {
    const tmpl = await fs.readFile(path.join(fixturesPath, templateWithBarcode), 'utf8');

    // since we removed the actual html templating, this is a poor man's templating
    // in of the barcode rendererj
    const templated = tmpl
      .replace('{{nodeModulesPath}}', nodeModulesPath);

    const params = { main : 'This is a test', value : 'hi' };
    const result = await pdf.render(params, templated, {});
    const hasValidVersion = hasValidPdfVersion(result.toString());
    const isBuffer = isBufferInstance(result);
    expect(isBuffer && hasValidVersion).to.be.equal(true);
  });

});

/**
 * hasValidPdfVersion
 * @description check if the pdf version is valid
 * @param {string} fileInString the pdf file in string
 */
function hasValidPdfVersion(fileInString) {
  const pdfHeader = fileInString.substr(0, 8); // This gets the first 8 bytes/characters of the file
  const regex = /%PDF-1.[0-7]/; // This Regular Expression is used to check if the file is valid
  const result = pdfHeader.match(regex);
  return !!(result.length);
}

/**
 * @description check if the given file is an instance of Buffer
 * @param {object} file
 */
function isBufferInstance(file) {
  return file instanceof Buffer;
}
