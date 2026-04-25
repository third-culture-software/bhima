const { describe, it }= require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

const rewire = require('rewire');

/**
 * Mock an HTML renderer without the complexity of BHIMA's bundle one
 * @param data
 * @param template
 */
const mockHTMLRenderer = (data, template) => {
   
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

describe('test/server-unit/pdf', function () { 
  const opts = { timeout : 5000 };

  it('#pdf.render() renders a valid PDF file', opts, async () => {
    const htmlString = await fs.readFile(template, 'utf8');
    const result = await pdf.render(data, htmlString, {});
    const hasValidVersion = hasValidPdfVersion(result.toString());
    const isBuffer = isBufferInstance(result);
    assert.ok(isBuffer && hasValidVersion, 'Failed to render a valid PDF buffer.');
  });

  it('#pdf.render() templates in a barcode to the pdf file', opts, async () => {
    const tmpl = await fs.readFile(path.join(fixturesPath, templateWithBarcode), 'utf8');

    // since we removed the actual html templating, this is a poor man's templating
    // in of the barcode rendererj
    const templated = tmpl
      .replace('{{nodeModulesPath}}', nodeModulesPath);

    const params = { main : 'This is a test', value : 'hi' };
    const result = await pdf.render(params, templated, {});
    const hasValidVersion = hasValidPdfVersion(result.toString());
    const isBuffer = isBufferInstance(result);
    assert.ok(isBuffer && hasValidVersion, 'Failed to render a valid PDF buffer.');
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

const isBufferInstance = (file) => file instanceof Buffer;
