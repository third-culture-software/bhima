const { describe, it, before, after }= require('node:test');
const assert = require('node:assert/strict');

const util = require('../../server/lib/util');
const numberToText = require('../../server/lib/NumberToText');
const en = require('../../client/src/i18n/en/numbers.json');
const fr = require('../../client/src/i18n/fr/numbers.json');

const { loadDictionary } = util;

describe('test/server-unit/numberToText', () => {

  // use local dictionary
  before(() => {
    util.loadDictionary = lang => (lang === 'fr' ? fr : en);
  });

  // mock translation dictionaries
  const dictionaries = { en, fr };

  const currencies = {
    fr : { usd : 'Dollars', fc : 'Franc Congolais' },
    en :  { usd : 'Dollars', fc : 'Congolese francs' },
  };

  it(`the number 1 in English and USD correctly renders 'One dollar'.`, () => {
    const input = 1;
    const expected = `One ${currencies.en.usd}`;
    const convertedNumber = numberToText.convert(input, 'en', currencies.en.usd, dictionaries.en);
    assert.equal(convertedNumber, expected, `The converted number should be '${expected}' but got '${convertedNumber}'`);
  });

  it(`the number 1 in French and FC correctly renders 'Un Franc Congolais'.`, () => {
    const input = 1;
    const expected = `Un ${currencies.fr.fc}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.fc, dictionaries.fr);
    assert.equal(convertedNumber, expected, `The converted number should be '${expected}' but got '${convertedNumber}'`);
  });

  it(`a negative number is provided, it absolute value eill be used instead.`, () => {
    const input = -10;
    const expected = `Dix ${currencies.fr.fc}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.fc, dictionaries.fr);
    assert.equal(convertedNumber, expected, `The converted number should be '${expected}' but got '${convertedNumber}'`);
  });

  it(`an unknown currency is provided, undefined will be used as default value.`, () => {
    const input = -10;
    const expected = `Dix ${currencies.fr.x}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.x, dictionaries.fr);

    assert.equal(convertedNumber, expected, `The converted number should be '${expected}' but got '${convertedNumber}'`);
  });

  it(`a null number will be interpreted as 0.`, () => {
    const input = null;
    const expected = `Zéro ${currencies.fr.usd}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.usd, dictionaries.fr);

    assert.equal(convertedNumber, expected, `The converted number should be '${expected}' but got '${convertedNumber}'`);
  });

  after(() => {
    util.loadDictionary = loadDictionary;
  });
});
