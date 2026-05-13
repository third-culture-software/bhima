const { describe, it, beforeEach }= require('node:test');
const assert = require('node:assert/strict');

const Filter = require('../../server/lib/filter');

describe('test/server-unit/filter', () => {
  const object1 = {
    id : 1,
    name : 'Unit Test',
    date_object : '1960-06-30',
    value : '1000000',
    list : [1, 2, 3],
    country_id : 243,
    period : 'month',
    country : 'dr congo',
    town : 'Kinshasa',
    street : 'Sgt Moke',
    location : 'Safricas / Sgt Moke/ Kinshasa / DR Congo',
    dateFrom : '1960-06-30',
    dateTo : '1997-05-17',
  };

  const object2 = {
    id : 1,
    label : 'PROFIT',
    number : 7001010,
    dateCentury : '2000-01-01',
    limit : 3,
    period : 'week',
  };

  const object3 = {
    id : 1,
    abbr : 'js',
    display_name : 'javascript',
  };

  const object4 = {
    grade_uuid : 'c8a406a953d6429f84d8fc497875a580',
    grade : 'Lieutenant-général',
  };

  let filters;
  let filters2;
  let sql;
  let sql2;
  let sql3;

  beforeEach(() => {
    filters = new Filter(object1, { tableAlias : 't' });
    filters2 = new Filter(object2, { tableAlias : 'a' });

    sql = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t`;
    sql2 = `SELECT t.id, t.street, t.town, t.country, t.location FROM geographic AS t`;
    sql3 = `SELECT a.id, a.label, a.number, a.dateCentury FROM accounts AS a`;
  });

  it('#fullText Format the sql query when filtered by full text', () => {
    // fullText matches the SQL "LIKE" filter.
    filters.fullText('name');

    const formatted = filters.applyQuery(sql).trim();
    const params = filters.parameters();
     
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE LOWER(t.name) LIKE ?`;

    // Check that param param is working properly
    assert.deepEqual(params, ['%Unit Test%']);

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#period Format the sql query when filtered by Period', () => {
    // filters.period matches the sql if Date is between a period defined by dateFrom and dateTo
    filters.period('period', 'date_object');

     
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE DATE(t.date_object) >= DATE(?) AND DATE(t.date_object) <= DATE(?)`;
    const formatted = filters.applyQuery(sql).trim();

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#dateFrom Format the sql query when filtered by dateFrom', () => {
    // fullText matches the SQL "DATE(...) >= DATE(?)" filter.
    filters.dateFrom('date_object');

     
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE DATE(t.date_object) >= DATE(?)`;
    const formatted = filters.applyQuery(sql).trim();

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#dateTo Format the sql query when filtered by dateTo', () => {
    // fullText matches the SQL "DATE(...) <= DATE(?)" filter.
    filters.dateTo('date_object');

     
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE DATE(t.date_object) <= DATE(?)`;
    const formatted = filters.applyQuery(sql).trim();

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#dateFrom and #dateTo Format the sql query when filtered by date range', () => {
    // filters.period matches the sql if Date is between a period defined by dateFrom and dateTo
    filters.dateFrom('dateFrom', 'date_object');
    filters.dateTo('dateTo', 'date_object');

     
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE DATE(t.date_object) >= DATE(?) AND DATE(t.date_object) <= DATE(?)`;

    const formatted = filters.applyQuery(sql).trim();
    assert.equal(formatted, expected);
  });

  it('#equals Format the sql query when filtered by equals', () => {
    // fullText matches the SQL "=" filter.
    filters.equals('value');

    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE t.value = ?`;
    const formatted = filters.applyQuery(sql).trim();

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#equals() formats an array of values', () => {
    filters.equals('list', 'id', 't', true);

    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE t.id IN (?)`;
    const formatted = filters.applyQuery(sql).trim();

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#custom Format the sql query when filtered by custom', () => {
    // custom matches the SQL  custom SQL with either single or multiple parameters.
    filters.custom('list', 't.id IN (?)', [object1.list]);
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE t.id IN (?)`;
    const formatted = filters.applyQuery(sql).trim();
    const params = filters.parameters();

    // check that the filters.parameters() returns the correct values after a filter is applied.
    assert.deepEqual(params, [[1, 2, 3]]);

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#customMultiParameters Format the sql query when filtered by customMultiParameters', () => {
    const params = ['Kinshasa', 'Kinshasa', 'Kinshasa'];
    const geographicSql = `(t.street LIKE ?) OR (t.town LIKE ?) OR (t.country LIKE ?)`;
     
    const expected = `SELECT t.id, t.street, t.town, t.country, t.location FROM geographic AS t WHERE (t.street LIKE ?) OR (t.town LIKE ?) OR (t.country LIKE ?)`;

    filters.custom('location', geographicSql, params);
    const formatted = filters.applyQuery(sql2).trim();

    assert.equal(formatted, expected);
  });

  it('Format the sql query when set ORDER BY and GROUP BY', () => {
    filters.setOrder('ORDER BY t.name');
    filters.setGroup('GROUP BY t.country_id');

     
    const expected = `SELECT t.id, t.name, t.date_object, t.value, t.country_id FROM tables AS t WHERE 1 GROUP BY t.country_id ORDER BY t.name`;

    const formatted = filters.applyQuery(sql).trim();
    assert.equal(formatted, expected);
  });

  it('#fullText Format the sql query when filtered by full text, by Period and Limited number of rows', () => {
    filters2.fullText('label');
    filters2.period('period', 'date_century');

    const formatted = filters2.applyQuery(sql3).trim();
     
    const expected = `SELECT a.id, a.label, a.number, a.dateCentury FROM accounts AS a WHERE LOWER(a.label) LIKE ?  AND DATE(a.date_century) >= DATE(?) AND DATE(a.date_century) <= DATE(?)   LIMIT 3`;
    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('#Test a query with autoParseStatments with autoParseStatments is true.', () => {
    // Verify parr is true, to format the query to filter against all columns in the table
    filters = new Filter(object3, { tableAlias : 'j', autoParseStatements : true });
    sql = `SELECT j.id, j.abbr, j.display_name FROM javascript AS j`;
    const formatted = filters.applyQuery(sql).trim();

     
    const expected = `SELECT j.id, j.abbr, j.display_name FROM javascript AS j WHERE j.id = ? AND j.abbr = ? AND j.display_name = ?`;

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });

  it('Format the SQL when Parsed Automatically Uuid.', () => {
    // Check on autoParseStatements is true, look in the query if a column is of type uuid for formatter
    filters = new Filter(object4, { tableAlias : 'g', autoParseStatements : true });
    sql = `SELECT g.grade_uuid, g.grade FROM grade AS g`;
    const formatted = filters.applyQuery(sql).trim();

    const expected = `SELECT g.grade_uuid, g.grade FROM grade AS g WHERE g.grade_uuid = HUID(?) AND g.grade = ?`;

    // assert that the SQL is formatted correctly.
    assert.equal(formatted, expected);
  });
});
