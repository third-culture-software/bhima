const { describe, it, before }= require('node:test');
const assert = require('node:assert/strict');

const db = require('../../server/lib/db');

describe('test/server-unit/mysql_functions', () => {

  const tableName1 = 'my_test_table1';
  const tableName2 = 'my_test_table2';
  const constraint1 = 'constraint1';
  const constraint2 = 'constraint2';

  before(async () => {
    await db.exec(`DROP TABLE IF EXISTS ${tableName1};`);
    await db.exec(`DROP TABLE IF EXISTS ${tableName2};`);
  });


  const createTable1Sql = `
    CREATE TABLE IF NOT EXISTS ${tableName1} (
      uuid BINARY(16) PRIMARY KEY,
      name VARCHAR(40)
    )ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `;

  const createTable2Sql = `
    CREATE TABLE IF NOT EXISTS ${tableName2} (
      uuid BINARY(16) PRIMARY KEY,
      type VARCHAR(40),
      uuid_parent BINARY(16),
      uuid_parent2 BINARY(16),
      INDEX \`type\`(\`type\`),
    CONSTRAINT \`${constraint1}\` FOREIGN KEY (\`uuid_parent\`)
    REFERENCES \`${tableName2}\` (\`uuid\`) ON DELETE CASCADE,

    CONSTRAINT \`${constraint2}\` FOREIGN KEY (\`uuid_parent2\`)
    REFERENCES \`${tableName2}\` (\`uuid\`) ON DELETE CASCADE
    )ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `;

  const checkIfConstraintExistSql = ` SELECT Constraint_exists("${tableName2}", "${constraint1}") as exist;`;
  const checkIfConstraintIfExistSql = ` SELECT Constraint_exists("${tableName2}", "unknown") as exist;`;
  const dropFKExistSql = ` SELECT Constraint_exists("${tableName2}",  "${constraint2}") as exist;`;
  const dropForeignKeySql = ` CALL drop_foreign_key("${tableName2}", "${constraint2}");`;
  const dropUnknownForeignKeySql = ` CALL drop_foreign_key("${tableName2}", "unknown");`;
  const dropUnknownColumnSql = ` CALL drop_column_if_exists("${tableName2}", "unknown");`;
  const dropColumnSql = ` CALL drop_column_if_exists("${tableName2}", "uuid_parent2");`;
  const checkIfColumnExistSql = ` SELECT bh_column_exists("${tableName2}", "uuid_parent2") as exist;`;
  const checkIfIndexExistSql = ` SELECT index_exists("${tableName2}", "type") as exist;`;
  const dropUnknownIndexSql = ` CALL drop_index_if_exists("${tableName2}", "unknown");`;
  const dropIndexSql = ` CALL drop_index_if_exists("${tableName2}", "type");`;

  it('should create the test table1', async () => {
    const res = await db.exec(createTable1Sql);
    assert.ok(res, 'Failed to create the first test table');
  });

  it('should create the test table2', async () => {
    const res = await db.exec(createTable2Sql);
    assert.ok(res, 'Failed to create the second test table');
  });

  it('check if a constraint exist', async () => {
    const row = await db.one(checkIfConstraintExistSql);
    assert.ok(row.exist, 'Failed to find the existing constraint');
  });

  it('#check if a constraint doestn\'t exist', async () => {
    const row = await db.one(checkIfConstraintIfExistSql);
    assert.equal(row.exist, 0, 'Failed to check the non existing constraint');
  });

  it('#drop a foreign key by calling drop_foreign_key', async () => {
    const res = await db.exec(dropForeignKeySql);
    assert.ok(res, 'Failed to drop the existing foreign key');
  });

  it('#drop a no existing foreign key by calling drop_foreign_key', async () => {
    const res = await db.exec(dropUnknownForeignKeySql);
    assert.ok(res, 'Failed to drop the non existing foreign key');
  });

  it('#check if a dropped column doesnt exist', async () => {
    const row = await db.one(dropFKExistSql);
    assert.equal(row.exist, 0, 'Failed to check the dropped columnkey');
  });

  it('#check if a column exists', async () => {
    const row = await db.one(checkIfColumnExistSql);
    assert.equal(row.exist, 1, 'Failed to find the existing column');
  });

  it('#drop a no existing column by calling drop_column_if_exists', async () => {
    const res = await db.exec(dropUnknownColumnSql);
    assert.ok(res, 'Failed to drop the non existing column');
  });

  it('#drop an existing column by calling drop_column_if_exists', async () => {
    const res = await db.exec(dropColumnSql);
    assert.ok(res, 'Failed to drop the existing column');
  });

  it('#check if a column has really been removed', async () => {
    const row = await db.one(checkIfColumnExistSql);
    assert.equal(row.exist, 0, 'The column was not removed.');
  });

  it('#check if an index exists in a table', async () => {
    const row = await db.one(checkIfIndexExistSql);
    assert.equal(row.exist, 1, 'Failed to find the existing index.');
  });

  it('#drop a no existing index by calling drop_index_if_exists', async () => {
    await db.exec(dropUnknownIndexSql);
    assert.ok(true);
  });

  it('#drop an existing index by calling drop_index_if_exists', async () => {
    await db.exec(dropIndexSql);
    assert.ok(true);
  });

  it('#check if the index has really been removed', async () => {
    const row = await db.one(checkIfIndexExistSql);
    assert.equal(row.exist, 0, 'The index was not removed.');
  });

});
