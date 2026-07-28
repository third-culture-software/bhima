const util = require('../util');

// these are resolved at compile time
const dictionaries = {};

/**
 * @function getTranslationHelper
 * @description
 * Returns a compiler function that will translate all text using a dictionary
 * @param {string} languageKey - either 'fr' or 'en'
 */
function getTranslationHelper(languageKey) {
  const key = String(languageKey).toLowerCase() === 'fr' ? 'fr' : 'en';
  const dictionary = util.loadDictionary(key, dictionaries);

  /**
   * @param translateCode
   * @function translate
   *
   * This helper method is responsible for looking up a translation value from
   * a JSON object. It allows the template to specify nested keys a string as follows
   *  'FIRST_CATEGORY.SECOND_CATEGORY.ATTRIBUTE'
   */
  return function translate(translateCode) {
    // Look up a nested value by dot-separated path.
    // If the path does not exist, return the original code.
    const value = String(translateCode)
      .split('.')
      .reduce((obj, part) => obj?.[part], dictionary);
    return value || translateCode;
  };
}

module.exports = getTranslationHelper;
