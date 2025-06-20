const { expect } = require('chai');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const util = require('../../server/lib/util');

describe('test/server-unit/util', () => {

  it('#take() should take values from one key of each object in an array of objects', () => {
    const objects = [{ id : 1 }, { id : 2 }, { id : 3 }];
    const expected = [1, 2, 3];
    const filter = util.take('id');
    const ids = _.flatMap(objects, filter);
    expect(ids).to.deep.equal(expected);
  });

  it('#requireModuleIfExists() should require module if it exists', () => {
    const exists = util.loadModuleIfExists('chai');
    expect(exists).to.equal(true);
  });

  it('#dateFormatter() should format each javascript datetime value in a array of objects', () => {
    const rows = [
      { name : 'alice', dob : new Date('2015-03-25 12:00:00') },
      { name : 'bob', dob : new Date('2015-03-30 12:00:00') },
    ];

    const expected = [
      { name : 'alice', dob : '25/03/2015' },
      { name : 'bob', dob : '30/03/2015' },
    ];

    const dateFormat = 'DD/MM/YYYY';
    const formated = util.dateFormatter(rows, dateFormat);
    expect(formated).to.deep.equal(expected);
  });

  it('#roundDecimal() should round a number to the specified number of decimal places', () => {
    let value = 12.125;
    expect(util.roundDecimal(value, 2)).to.equal(12.13);
    expect(util.roundDecimal(value, 3)).to.equal(value);
    expect(util.roundDecimal(value, 0)).to.equal(12);

    value = 12.00;
    expect(util.roundDecimal(value, 2)).to.equal(value);
    expect(util.roundDecimal(value, 3)).to.equal(value);
    expect(util.roundDecimal(value, 0)).to.equal(value);
  });

  it('#roundDecimal() defaults to 4 decimal places precision', () => {
    const value = 12.11111;
    expect(util.roundDecimal(value)).to.equal(12.1111);
  });

  it('Should rename an object\'s keys', () => {
    const a = [{ id : 1 }];
    const keyMap = { id : 'hello' };
    const result = util.renameKeys(a, keyMap);
    expect(result).to.deep.equal([{ hello : 1 }]);
  });

  it('Should retain an emo', () => {
    const a = [];
    const keyMap = { id : 'hello' };
    const result = util.renameKeys(a, keyMap);
    expect(result).to.deep.equal([]);
  });

  it('should calculate an age from a date', () => {
    const now = new Date();

    const fourYearsAgo = now.getFullYear() - 4;
    const old = new Date(fourYearsAgo, now.getMonth(), now.getDate());

    expect(util.calculateAge(old)).to.equal(4);
  });

  it('#formatCsvToJson should return a json from a csv file', () => {
    /**
     * The structure of the sample csv file (ohada-accounts.csv)
     * =========================================================
     * "account_number",  "account_label",    "account_type", "account_parent"
     * "10",              "CAPITAL",          "title",        "1"
     * "12",              "REPORT A NOUVEAU", "title",        "1"
     */
    const filePath = 'test/fixtures/ohada-accounts.csv';
    const promise = util.formatCsvToJson(path.resolve(filePath));
    return promise
      .then(csvObjectArray => {
        const [first, second] = csvObjectArray;
        expect(csvObjectArray).to.be.an('array');

        // check the value contained in the csv file
        expect(first).to.have.property('account_number', '10');
        expect(first).to.have.property('account_label', 'CAPITAL');
        expect(first).to.have.property('account_type', 'title');
        expect(first).to.have.property('account_parent', '1');

        expect(second).to.have.property('account_number', '12');
        expect(second).to.have.property('account_label', 'REPORT A NOUVEAU');
        expect(second).to.have.property('account_type', 'title');
        expect(second).to.have.property('account_parent', '1');

        // check properties of each element of the array correspond to column of the file
        csvObjectArray.forEach(csvObject => {
          expect(csvObject).to.be.an('object');
          expect(csvObject).to.have.property('account_number');
          expect(csvObject).to.have.property('account_label');
          expect(csvObject).to.have.property('account_type');
          expect(csvObject).to.have.property('account_parent');
        });
      });
  });

  it('#median() should return the median of an array', () => {
    // Odd number of entries
    const array1 = [1, 2, 1, 3, 4]; // Note non-sorted
    const med1 = util.median(array1);
    expect(med1).to.equal(2);

    // Even number of entries
    const array2 = [1, 3, 1, 4, 2, 6];
    // Sorted: 1, 1, 2, 3, 4, 6 = median = 2.5
    const med2 = util.median(array2);
    expect(med2).to.equal(2.5);

    // Check 0 len array
    const med3 = util.median([]);
    expect(med3).to.equal(null);

    // Check 1 len array
    const array4 = [3];
    const med4 = util.median(array4);
    expect(med4).to.equal(array4[0]);
  });

  it('#convertToNumericArray() should correctly convert various inputs', () => {
    // Normal array of integers
    const normalArray = [1, 2, 3, 4];
    const normalResult = util.convertToNumericArray(normalArray);
    expect(normalResult).to.deep.equal([1, 2, 3, 4]);

    // Array with missing values (sparse array)
    const sparseArray = [1, undefined, undefined, undefined, undefined, 3];
    const sparseResult = util.convertToNumericArray(sparseArray);
    expect(sparseResult.length).to.equal(6);
    expect(sparseResult[0]).to.equal(1);
    expect(Number.isNaN(sparseResult[1])).to.equal(true);
    expect(Number.isNaN(sparseResult[2])).to.equal(true);
    expect(Number.isNaN(sparseResult[3])).to.equal(true);
    expect(Number.isNaN(sparseResult[4])).to.equal(true);
    expect(sparseResult[5]).to.equal(3);

    // Array with string numbers
    const stringArray = ['1', '2', '3', '5', '4'];
    const stringResult = util.convertToNumericArray(stringArray);
    expect(stringResult).to.deep.equal([1, 2, 3, 5, 4]);

    // Array with non-integer values
    const floatArray = [1.3, 2.5];
    const floatResult = util.convertToNumericArray(floatArray);
    expect(floatResult).to.deep.equal([1.3, 2.5]);

    // Empty array
    const emptyArray = [];
    const emptyResult = util.convertToNumericArray(emptyArray);
    expect(emptyResult).to.deep.equal([]);

    // Mixed types
    const mixedArray = [1, '2.3', ''];
    const mixedResult = util.convertToNumericArray(mixedArray);
    expect(mixedResult[0]).to.equal(1);
    expect(mixedResult[1]).to.equal(2.3);
    expect(mixedResult[2]).to.equal(0); // '' converted to 0
  });

  it('#stringToNumber() should convert numeric strings to numbers and preserve non-numeric values', () => {
    expect(util.stringToNumber('123')).to.equal(123);
    expect(util.stringToNumber('12.5')).to.equal(12.5);
    expect(util.stringToNumber('abc')).to.equal('abc');
    expect(util.stringToNumber('')).to.equal(0);
    expect(util.stringToNumber(undefined)).to.equal(undefined);
  });

  it('#convertStringToNumber() converts all string numbers in object to numbers', () => {
    const obj = {
      a : '1', b : '2.5', c : 'foo', d : 3,
    };
    const result = util.convertStringToNumber(_.clone(obj));
    expect(result).to.deep.equal({
      a : 1, b : 2.5, c : 'foo', d : 3,
    });
  });

  it('#renameKeys() should handle stringified newKeys and non-array objects', () => {
    const obj = { old : 5 };
    const keyMapStr = JSON.stringify({ old : 'new' });
    const result = util.renameKeys(obj, keyMapStr);
    expect(result).to.deep.equal({ new : 5 });
  });

  it('#renameKeys() should leave keys unchanged if mapping is missing', () => {
    const obj = { a : 1, b : 2 };
    const result = util.renameKeys(obj, { a : 'alpha' });
    expect(result).to.deep.equal({ alpha : 1, b : 2 });
  });

  it('#createDirectory() should create a directory if not exists', () => {
    const testDir = path.join(__dirname, 'test-tmp-dir');
    // Remove before test to ensure clean state
    if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    util.createDirectory(testDir);
    expect(fs.existsSync(testDir)).to.equal(true);
    fs.rmdirSync(testDir);
  });

  it('#createDirectory() should not throw if directory already exists', () => {
    const testDir = path.join(__dirname, 'test-tmp-dir2');
    util.createDirectory(testDir);
    expect(() => util.createDirectory(testDir)).to.not.throw();
    fs.rmdirSync(testDir);
  });

  it('#getRandomColor() should return a valid rgb string', () => {
    const color = util.getRandomColor();
    expect(color).to.match(/^rgb\(\d+,\d+,\d+\)$/);
    const nums = color.match(/\d+/g).map(Number);
    expect(nums.every(n => n >= 0 && n < 256)).to.equal(true);
  });

  it('#uuid() should return a 32-character uppercase hex string (no dashes)', () => {
    const value = util.uuid();
    expect(value).to.match(/^[0-9A-F]{32}$/);
  });

  it('#getPeriodIdForDate() should return correct period id', () => {
    const date = new Date(2020, 1, 15); // February (0-based)
    const period = util.getPeriodIdForDate(date);
    expect(period).to.equal('202002');
    const jan = new Date(2020, 0, 1);
    expect(util.getPeriodIdForDate(jan)).to.equal('202001');
    const dec = new Date(2020, 11, 1);
    expect(util.getPeriodIdForDate(dec)).to.equal('202012');
  });
});
