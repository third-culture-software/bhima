/* eslint global-require: "off" */
const rewire = require('@ima-worldhealth/rewire');
const { expect } = require('chai');

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
    expect(compiler).to.be.a('function');
  });

  it('#translate() should return a string from the compiler', () => {
    const compiled = translate('en')('COLORS.GRAY');
    expect(compiled).to.be.a('string');
  });

  it('#translate() should translate multiple languages', () => {
    let compiled = translate('en')('COLORS.GRAY');
    expect(compiled).to.equal('Gray');

    compiled = translate('fr')('COLORS.GRAY');
    expect(compiled).to.equal('Gris');
  });

  it('#translate() should default to English using an unknown language key', () => {
    const compiled = translate('lg')('COLORS.GRAY'); // no support for lingala
    expect(compiled).to.equal('Gray');
  });

  it('#translate() should return the input if no matching key found', () => {
    const key = 'COLORS.NO_KEY_VALUE_PAIR';
    const compiled = translate('en')(key);
    expect(compiled).to.equal(key);
  });

  it('#translate() should return undefined for undefined value', () => {
    const compiled = translate('en')(undefined);
    expect(compiled).to.equal(undefined);
  });

});
