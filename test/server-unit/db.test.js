const { describe, it, before }= require('node:test');
const assert = require('node:assert/strict');

describe('test/server-unit/db', () => {

  let db;
  before(() => {
    db = require('../../server/lib/db');
  });

  it('should check the connection to mysql', async () => {
    let conn = await db.pool.getConnection()
    assert.ok(conn, 'The database pool should aquire a connection');
  });

  it('#exec() should retrieve a promise result', async () => {
    const [result] = await db.exec('SELECT 1 + 1 AS two;');
    assert.strictEqual(result.two, 2, 'The query should return the correct result');
  });

  it('should try to retrieve data from a specific table (unit)', async () => {
    const rows = await db.exec('SELECT * FROM unit LIMIT 2');
    assert.ok(Array.isArray(rows), 'The result should be an array of rows.');
    assert.equal(rows.length, 2, 'The result should contain 2 rows.');
  });

  it('should execute a transaction successfully', async () => {
    const rows = await db.transaction()
      .addQuery('SELECT 1 + 1 as two;')
      .addQuery('SELECT 2 + 2 as four;')
      .execute();

    assert.ok(Array.isArray(rows), 'The transaction should be an array of rows.');
    assert.equal(rows.length, 2, 'The transaction should contain 2 rows.');

    const [[{ two }], [{ four }]] = rows;
    assert.equal(two, 2, 'The first query should return 2.');
    assert.equal(four, 4, 'The second query should return 4.');
  });

  it('should close those database connnection pool', async () => {
    await db.pool.end();
    assert.ok(true, 'The database pool was closed.');
  });
});
