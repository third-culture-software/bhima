const { describe, it }= require('node:test');
const assert = require('node:assert/strict');
const rewire = require('rewire');

// mock translation dictionaries
const dictionaries = {
  en : require('../fixtures/translations-en.json'),
  fr : require('../fixtures/translations-fr.json'),
};

const translate = rewire('../../server/lib/helpers/translate');
translate.__set__('dictionaries', dictionaries);

describe('test/server-unit/translate', () => {

  it('#translate() should return a compiler function', () => {
    const compiler = translate('fr');
    assert.equal(typeof compiler, 'function', 'The translate function should return a compiler function');
  });

  it('#translate() should return a string from the compiler', () => {
    const compiled = translate('en')('COLORS.GRAY');
    assert.equal(typeof compiled, 'string', 'The compiler function should return a string');
  });

  it('#translate() should translate multiple languages', () => {
    let compiled = translate('en')('COLORS.GRAY');
    assert.equal(compiled, 'Gray', 'The English translation for COLORS.GRAY should be "Gray"');

    compiled = translate('fr')('COLORS.GRAY');
    assert.equal(compiled, 'Gris', 'The French translation for COLORS.GRAY should be "Gris"');
  });

  it('#translate() should default to English using an unknown language key', () => {
    const compiled = translate('lg')('COLORS.GRAY'); // no support for lingala
    assert.equal(compiled, 'Gray');
  });

  it('#translate() should return the input if no matching key found', () => {
    const key = 'COLORS.NO_KEY_VALUE_PAIR';
    const compiled = translate('en')(key);
    assert.equal(compiled, 'Gray');
  });

  it('#translate() should return undefined for undefined value', () => {
    const compiled = translate('en')(undefined);
    assert.equal(compiled, undefined);
  });
});
