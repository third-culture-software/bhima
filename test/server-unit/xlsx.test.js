const { describe, it }= require('node:test');
const assert = require('node:assert/strict');

const rewire = require('rewire');

const xlsx = rewire('../../server/lib/renderers/xlsx');

// mock the translation as a no-op function
xlsx.__set__('i18n', () => (() => {}));

describe('test/server-unit/xlsx', () => {
  const data = {
    rows : [{ Firstname : 'Alice', Lastname : 'Bob' }],
  };

  it('render() should return a xlsx buffer', async () => {
    const reportStream = await xlsx.render(data, null, { lang : 'en' });
    assert.ok(Buffer.isBuffer(reportStream))
  });

  it('render() should work for an empty object', async () => {
    const reportStream = await xlsx.render({}, null, { lang : 'fr' });
    assert.ok(Buffer.isBuffer(reportStream))
  });

  it('find() should check the number of rows to write in the xlsx file', () => {
    const result = xlsx.find(data);
    assert.equal(result.length, 1, 'The number of rows to write in the xlsx file should be 1.');
    assert.deepEqual(result, data.rows, 'The rows to write in the xlsx file should match the expected data');
  });

  it('find() should check the number of rows to write in the xlsx file by specifying a key', () => {
    let ndata = { students : [ { name : 'Alice' }, { name : 'Bob' }], };
    // rowsDataKey is the specific key where the renderer will get data to write in the expected file
    // it is used when the provided array doesn't have this key "rows"
    const options = { rowsDataKey : 'students' };
    const result = xlsx.find(ndata, options);
    assert.equal(result.length, 2, 'The number of rows to write in the xlsx file should be 2.');
    assert.deepEqual(result, ndata.students, 'The rows to write in the xlsx file should match the expected data');
  });

  it('find() should remove unused columns for the user such as uuid', () => {
    const ndata = {
      students : [
        { uuid : '7a9480cc-b2cd-4975-a1dc-e8c167070481', name : 'Alice' },
        { uuid : '1459ce89-5d67-4019-84d8-b2bcb808eacb', name : 'Bob' }],
    };

    const formattedData = [ { name : 'Alice' }, { name : 'Bob' }, ];
    const options = { rowsDataKey : 'students', ignoredColumns : ['uuid'] };
    const result = xlsx.find(ndata, options);
    assert.deepEqual(result, formattedData, 'The rows to write in the xlsx file should match the expected data without the ignored columns');
  });

  it('find() should not crash on an invalid date', () => {
    const ndata = {
      students : [
        { name : 'Alice', dob : new Date('1980-06-13') },
        { name : 'Bob', dob : new Date('') },
      ],
    };

    const formattedData = [
      { name : 'Alice', dob : new Date('1980-06-13') },
      { name : 'Bob', dob : new Date('') },
    ];

    const options = { rowsDataKey : 'students' };
    const result = xlsx.find(ndata, options);
    assert.deepEqual(result, formattedData, 'The rows to write in the xlsx file should match the expected data even with an invalid date');
  });
});
