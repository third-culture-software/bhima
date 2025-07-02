const { expect } = require('chai');
const numberToText = require('../../server/lib/NumberToText');
const en = require('../../client/src/i18n/en/numbers.json');
const fr = require('../../client/src/i18n/fr/numbers.json');
const util = require('../../server/lib/util');

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

  it(`#Test that the number 1 in English and USD correctly renders 'One dollar'.`, () => {
    const input = 1;
    const expected = `One  ${currencies.en.usd}`;
    const convertedNumber = numberToText.convert(input, 'en', currencies.en.usd, dictionaries.en);

    expect(convertedNumber).to.be.equal(expected);
  });

  it(`#Test that the number 1 in French and FC correctly renders 'Un Franc Congolais'.`, () => {
    const input = 1;
    const expected = `Un  ${currencies.fr.fc}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.fc, dictionaries.fr);

    expect(convertedNumber).to.be.equal(expected);
  });

  it(`#Test when a negative number is passed, it absolute value will be used instead'.`, () => {
    const input = -10;
    const expected = `Dix  ${currencies.fr.fc}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.fc, dictionaries.fr);

    expect(convertedNumber).to.be.equal(expected);
  });

  /* @TODO : propose a default curreny when an undefied value is defined */
  it(`#Test when a unknow currency is passed, undefied will be used as default value'.`, () => {
    const input = -10;
    const expected = `Dix  ${currencies.fr.x}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.x, dictionaries.fr);

    expect(convertedNumber).to.be.equal(expected);
  });

  it(`#Test when a unknow currency is passed, undefied will be used as default value'.`, () => {
    const input = -10;
    const expected = `Dix  ${currencies.fr.x}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.x, dictionaries.fr);

    expect(convertedNumber).to.be.equal(expected);
  });

  it(`#Test when a null number is passed, 0 will be used as default value'.`, () => {
    const input = null;
    const expected = `Zéro ${currencies.fr.x}`;
    const convertedNumber = numberToText.convert(input, 'fr', currencies.fr.x, dictionaries.fr);

    expect(convertedNumber).to.be.equal(expected);
  });

  after(() => {
    util.loadDictionary = loadDictionary;
  });
});
