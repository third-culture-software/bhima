/* eslint global-require:off */
const { expect } = require('chai');

describe('test/server-unit/db', () => {

  let db;
  before(() => {
    db = require('../../server/lib/db');
  });

  it('should check the connection to mysql', (done) => {
    db.pool.getConnection()
      .then(() => done())
      .catch(done);
  });

  it('#exec() should retrieve a promise result', async () => {
    const [result] = await db.exec('SELECT 1 + 1 AS two;');
    expect(result).to.deep.equal({ two : 2 });
  });

  it('should try to retrieve data from a specific table (unit)', async () => {
    const rows = await db.exec('SELECT * FROM unit LIMIT 2');
    expect(rows).to.have.lengthOf(2);
  });

  it('should execute a transaction successfully', async () => {
    const rows = await db.transaction()
      .addQuery('SELECT 1 + 1 as two;')
      .addQuery('SELECT 2 + 2 as four;')
      .execute();

    expect(rows).to.have.lengthOf(2);

    const [[{ two }], [{ four }]] = rows;
    expect(two).to.equal(2);
    expect(four).to.equal(4);
  });

});
