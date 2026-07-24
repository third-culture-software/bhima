/**
 * @module NumberToText
 */

const util = require('./util');

exports.convert = convert;

/**
 *
 * @param object
 * @param path
 * @param defaultValue
 */
function get(object, path, defaultValue = undefined) {
  return path
    .split('.')
    .reduce((value, key) => value?.[key], object) ?? defaultValue;
}

/**
 *
 * Source: http://stackoverflow.com/questions/14766951/convert-digits-into-words-with-javascript
 * >> Comment number 15
 * "Deceptively simple task." – Potatoswatter
 * Indeed. There's many little devils hanging out in the details of this problem. It was very fun to solve tho.
 * EDIT: This update takes a much more compositional approach.
 *  Previously there was one big function which wrapped a couple other proprietary functions.
 *  Instead, this time we define generic reusable functions which could be used for many varieties of tasks.
 *  More about those after we take a look at numToWords itself …
 */

/**
 *
 * @param input
 * @param lang
 * @param currencyName
 */
function convert(input, lang, currencyName) {
  // Round to at most 2 decimal places
  const number = Math.round(input, 2);

  const languageKey = String(lang).toLowerCase() === 'fr' ? 'fr' : 'en';
  const dictionary = util.loadDictionary(languageKey);

  const a = [
    '',
    get(dictionary, 'NUMBERS.ONE'),
    get(dictionary, 'NUMBERS.TWO'),
    get(dictionary, 'NUMBERS.THREE'),
    get(dictionary, 'NUMBERS.FOUR'),
    get(dictionary, 'NUMBERS.FIVE'),
    get(dictionary, 'NUMBERS.SIX'),
    get(dictionary, 'NUMBERS.SEVEN'),
    get(dictionary, 'NUMBERS.EIGHT'),
    get(dictionary, 'NUMBERS.NINE'),
    get(dictionary, 'NUMBERS.TEN'),
    get(dictionary, 'NUMBERS.ELEVEN'),
    get(dictionary, 'NUMBERS.TWELVE'),
    get(dictionary, 'NUMBERS.THIRTEEN'),
    get(dictionary, 'NUMBERS.FOURTEEN'),
    get(dictionary, 'NUMBERS.FIFTEEN'),
    get(dictionary, 'NUMBERS.SIXTEEN'),
    get(dictionary, 'NUMBERS.SEVENTEEN'),
    get(dictionary, 'NUMBERS.EIGHTEEN'),
    get(dictionary, 'NUMBERS.NINETEEN'),
  ];

  const b = [
    '',
    '',
    get(dictionary, 'NUMBERS.TWENTY'),
    get(dictionary, 'NUMBERS.THIRTY'),
    get(dictionary, 'NUMBERS.FORTY'),
    get(dictionary, 'NUMBERS.FIFTY'),
    get(dictionary, 'NUMBERS.SIXTY'),
    get(dictionary, 'NUMBERS.SEVENTY'),
    get(dictionary, 'NUMBERS.EIGHTY'),
    get(dictionary, 'NUMBERS.NINETY'),
  ];

  const g = [
    '',
    get(dictionary, 'NUMBERS.THOUSAND'),
    get(dictionary, 'NUMBERS.MILLION'),
    get(dictionary, 'NUMBERS.BILLION'),
    get(dictionary, 'NUMBERS.TRILLION'),
    get(dictionary, 'NUMBERS.QUADRILLION'),
    get(dictionary, 'NUMBERS.QUINTILLION'),
    get(dictionary, 'NUMBERS.SEXTILLION'),
    get(dictionary, 'NUMBERS.SEPTILLION'),
    get(dictionary, 'NUMBERS.OCTILLION'),
    get(dictionary, 'NUMBERS.NONILLION'),
  ];

  const arr = x => Array.from(x);
  const num = x => Number(x) || 0;
  const isEmpty = xs => xs.length === 0;
  const take = n => xs => xs.slice(0, n);
  const drop = n => xs => xs.slice(n);
  const reverse = xs => xs.slice().reverse();
  const comp = f => y => x => f(y(x));
  const not = x => !x;

  const chunk = n => xs => {
    if (isEmpty(xs)) {
      return [];
    }
    return [take(n)(xs), ...chunk(n)(drop(n)(xs))];
  };

  const formatHundreds = (huns) => {
    const isZero = num(huns) === 0;
    const isOne = huns === 1;
    const isFrench = languageKey === 'fr';

    if (isZero) {
      return '';
    } if (isFrench && isOne) {
      return ` ${get(dictionary, 'NUMBERS.HUNDRED')} `;
    }

    return `${a[huns]} ${get(dictionary, 'NUMBERS.HUNDRED')} `;
  };

  const formatOnes = (ones, tens) => {
    const isZero = num(ones) === 0;
    if (isZero) {
      return b[tens];
    } if (b[tens]) {
      return `${b[tens]}-`;
    }

    return '';
  };

  const numToWords = numbr => {
    const makeGroup = ([onesx, tens, hunsx]) => {
      const huns = parseInt(hunsx, 10);
      const ones = parseInt(onesx, 10);

      return [
        formatHundreds(huns),
        formatOnes(ones, tens),
        a[tens + ones] || a[ones],
      ].join('');
    };

    const thousand = (group, i) => {
      if (group === '') {
        return group;
      } if ((group === a[1]) && (languageKey === 'fr') && (g[i] === g[1])) {
        return ` ${g[i]}`;
      }

      return `${group} ${g[i]}`;
    };

    if (typeof numbr === 'number') {
      return numToWords(String(number));
    } if (numbr === '0') {
      return get(dictionary, 'NUMBERS.ZERO');
    }

    return comp(chunk(3))(reverse)(arr(numbr))
      .map(makeGroup)
      .map(thousand)
      .filter(comp(not)(isEmpty))
      .reverse()
      .join(' ');
  };

  const numberString = String(number);
  const numberPart =numberString.split('.');
  let numberText = numToWords(numberPart[0]);

  numberText = numberPart[1]
    ? `${numberText} ${get(dictionary, 'NUMBERS.POINT')} ${numToWords(numberPart[1])}`
    : numberText;

  return `${numberText} ${currencyName}`;
}
