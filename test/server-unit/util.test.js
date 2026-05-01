
const { describe, it }= require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const _ = require('lodash')

const util = require('../../server/lib/util');

describe('test/server-unit/util', () => {

  it('#take() should take values from one key of each object in an array of objects', () => {
    const objects = [{ id : 1 }, { id : 2 }, { id : 3 }];
    const expected = [1, 2, 3];
    const filter = util.take('id');
    const ids = _.flatMap(objects, filter);
    assert.deepEqual(ids, expected);
  });

  it('#requireModuleIfExists() should require module if it exists', () => {
    const exists = util.loadModuleIfExists('chai');
    assert.equal(exists, true);
  });

  it('#roundDecimal() should round a number to the specified number of decimal places', () => {
    let value = 12.125;
    assert.equal(util.roundDecimal(value, 2), 12.13);
    assert.equal(util.roundDecimal(value, 3), value);
    assert.equal(util.roundDecimal(value, 0), 12);

    value = 12.00;
    assert.equal(util.roundDecimal(value, 2), value);
    assert.equal(util.roundDecimal(value, 3), value);
    assert.equal(util.roundDecimal(value, 0), value);
  });

  it('#roundDecimal() defaults to 4 decimal places precision', () => {
    const value = 12.11111;
    assert.equal(util.roundDecimal(value), 12.1111);
  });

  it('Should rename an object\'s keys', () => {
    const a = [{ id : 1 }];
    const keyMap = { id : 'hello' };
    const result = util.renameKeys(a, keyMap);
    assert.deepEqual(result, [{ hello : 1 }]);
  });

  it('Should retain an emo', () => {
    const a = [];
    const keyMap = { id : 'hello' };
    const result = util.renameKeys(a, keyMap);
    assert.deepEqual(result, []);
  });

  it('should calculate an age from a date', () => {
    const now = new Date();

    const fourYearsAgo = now.getFullYear() - 4;
    const old = new Date(fourYearsAgo, now.getMonth(), now.getDate());

    assert.equal(util.calculateAge(old), 4);
  });

  it('#formatCsvToJson should return a json from a csv file', async () => {
    /**
     * The structure of the sample csv file (ohada-accounts.csv)
     * =========================================================
     * "account_number",  "account_label",    "account_type", "account_parent"
     * "10",              "CAPITAL",          "title",        "1"
     * "12",              "REPORT A NOUVEAU", "title",        "1"
     */
    const filePath = 'test/fixtures/ohada-accounts.csv';
    const csvObjectArray = await util.formatCsvToJson(path.resolve(filePath));
    assert.ok(Array.isArray(csvObjectArray), "The output should be an array.");

    const [first, second] = csvObjectArray;

    // check the value contained in the csv file
    assert.equal(first.account_number, '10');
    assert.equal(first.account_label, 'CAPITAL');
    assert.equal(first.account_type, 'title');
    assert.equal(first.account_parent, '1');

    assert.equal(second.account_number, '12');
    assert.equal(second.account_label, 'REPORT A NOUVEAU');
    assert.equal(second.account_type, 'title');
    assert.equal(second.account_parent, '1');

    // check properties of each element of the array correspond to column of the file
    csvObjectArray.forEach(csvObject => {
      assert.ok(csvObject.account_number, "Missing account_number");
      assert.ok(csvObject.account_label, "Missing account_label");
      assert.ok(csvObject.account_type, "Missing account_type");
      assert.ok(csvObject.account_parent, "Missing account_parent");
    });
  });

  it('#median() should return the median of an array', () => {
    // Odd number of entries
    const array1 = [1, 2, 1, 3, 4]; // Note non-sorted
    const med1 = util.median(array1);
    assert.equal(med1, 2);

    // Even number of entries
    const array2 = [1, 3, 1, 4, 2, 6];
    // Sorted: 1, 1, 2, 3, 4, 6 = median = 2.5
    const med2 = util.median(array2);
    assert.equal(med2, 2.5);

    // Check 0 len array
    const med3 = util.median([]);
    assert.equal(med3, null);

    // Check 1 len array
    const array4 = [3];
    const med4 = util.median(array4);
    assert.equal(med4, array4[0]);
  });

  it('#convertToNumericArray() should correctly convert various inputs', () => {
    // Normal array of integers
    const normalArray = [1, 2, 3, 4];
    const normalResult = util.convertToNumericArray(normalArray);
    assert.deepEqual(normalResult, [1, 2, 3, 4]);

    // Array with missing values (sparse array)
    const sparseArray = [1, undefined, undefined, undefined, undefined, 3];
    const sparseResult = util.convertToNumericArray(sparseArray);
    assert.equal(sparseResult.length, 6);
    assert.equal(sparseResult[0], 1);
    assert.equal(Number.isNaN(sparseResult[1]), true);
    assert.equal(Number.isNaN(sparseResult[2]), true);
    assert.equal(Number.isNaN(sparseResult[3]), true);
    assert.equal(Number.isNaN(sparseResult[4]), true);
    assert.equal(sparseResult[5], 3);

    // Array with string numbers
    const stringArray = ['1', '2', '3', '5', '4'];
    const stringResult = util.convertToNumericArray(stringArray);
    assert.deepEqual(stringResult, [1, 2, 3, 5, 4]);

    // Array with non-integer values
    const floatArray = [1.3, 2.5];
    const floatResult = util.convertToNumericArray(floatArray);
    assert.deepEqual(floatResult, [1.3, 2.5]);

    // Empty array
    const emptyArray = [];
    const emptyResult = util.convertToNumericArray(emptyArray);
    assert.deepEqual(emptyResult, []);

    // Mixed types
    const mixedArray = [1, '2.3', ''];
    const mixedResult = util.convertToNumericArray(mixedArray);
    assert.equal(mixedResult[0], 1);
    assert.equal(mixedResult[1], 2.3);
    assert.equal(mixedResult[2], 0); // '' converted to 0
  });

  it('#stringToNumber() should convert numeric strings to numbers and preserve non-numeric values', () => {
    assert.equal(util.stringToNumber('123'), 123);
    assert.equal(util.stringToNumber('12.5'), 12.5);
    assert.equal(util.stringToNumber('abc'), 'abc');
    assert.equal(util.stringToNumber(''), 0);
    assert.equal(util.stringToNumber(undefined), undefined);
  });

  it('#convertStringToNumber() converts all string numbers in object to numbers', () => {
    const obj = {
      a : '1', b : '2.5', c : 'foo', d : 3,
    };
    const result = util.convertStringToNumber(_.clone(obj));
    assert.deepEqual(result, {
      a : 1, b : 2.5, c : 'foo', d : 3,
    });
  });

  it('#renameKeys() should handle stringified newKeys and non-array objects', () => {
    const obj = { old : 5 };
    const keyMapStr = JSON.stringify({ old : 'new' });
    const result = util.renameKeys(obj, keyMapStr);
    assert.deepEqual(result, { new : 5 });
  });

  it('#renameKeys() should leave keys unchanged if mapping is missing', () => {
    const obj = { a : 1, b : 2 };
    const result = util.renameKeys(obj, { a : 'alpha' });
    assert.deepEqual(result, { alpha : 1, b : 2 });
  });

  it('#createDirectory() should create a directory if not exists', () => {
    const testDir = path.join(__dirname, 'test-tmp-dir');
    // Remove before test to ensure clean state
    if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    util.createDirectory(testDir);
    assert.ok(fs.existsSync(testDir), "Directory was not created.");
    fs.rmdirSync(testDir);
  });

  it('#createDirectory() should not throw if directory already exists', () => {
    const testDir = path.join(__dirname, 'test-tmp-dir2');
    util.createDirectory(testDir);
    assert.doesNotThrow(() => util.createDirectory(testDir));
    fs.rmdirSync(testDir);
  });

  it('#uuid() should return a 32-character uppercase hex string (no dashes)', () => {
    const value = util.uuid();
    assert.match(value, /^[0-9A-F]{32}$/);
  });

  it('#getPeriodIdForDate() should return correct period id', () => {
    const date = new Date(2020, 1, 15); // February (0-based)
    const period = util.getPeriodIdForDate(date);
    assert.equal(period, '202002');
    const jan = new Date(2020, 0, 1);
    assert.equal(util.getPeriodIdForDate(jan), '202001');
    const dec = new Date(2020, 11, 1);
    assert.equal(util.getPeriodIdForDate(dec), '202012');
  });

  const { formatDateString } = util;

  it('#formatDateString() formats a Date object to YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 6); // local 2026-01-06
    assert.equal(formatDateString(d), '2026-01-06');
  });

  it('#formatDateString() formats a local ISO-like string to YYYY-MM-DD', () => {
    assert.equal(formatDateString('2026-01-06T00:00:00'), '2026-01-06');
  });

  it('#formatDateString() formats a timestamp (ms since epoch) to YYYY-MM-DD', () => {
    const ts = new Date(2026, 0, 6).getTime();
    assert.equal(formatDateString(ts), '2026-01-06');
  });

  it('#formatDateString() pads month and day with leading zeros', () => {
    const d = new Date(2026, 8, 5); // 2026-09-05
    assert.equal(formatDateString(d), '2026-09-05');
  });

  it('#formatDateString() returns null for invalid input strings', () => {
    assert.equal(formatDateString('not-a-date'), null);
  });

  it('#formatDateString() returns null for NaN or invalid timestamps', () => {
    assert.equal(formatDateString(NaN), null);
  });

});
