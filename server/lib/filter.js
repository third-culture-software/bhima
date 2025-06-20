/* eslint class-methods-use-this:off */
const Periods = require('./period');

const RESERVED_KEYWORDS = ['limit', 'detailed'];
const DEFAULT_LIMIT_KEY = 'limit';
const DEFAULT_UUID_PARTIAL_KEY = 'uuid';

/**
 * @class FilterParser
 *
 * @description
 * This library provides a uniform interface for processing filter `options`
 * sent from the client to server controllers.
 * It providers helper methods for commonly request filters like date restrictions
 * and standardises the conversion to valid SQL.
 *
 * It implements a number of built in 'Filter Types' that allow column qurries
 * to be formatted for tasks that are frequently required.
 *
 * Supported Filter Types:
 * * equals - a direct comparison
 * * text - search for text contained within a text field
 * * dateFrom - limit the query to records from a date
 * * dateTo - limit the query to records up until a date
 *
 */
class FilterParser {
  // options that are used by all routes that shouldn't be considered unique filters
  constructor(filters = {}, options = {}) {
    // stores for processing options
    this._statements = [];
    this._parameters = [];

    this._filters = { ...filters };

    // configure default options
    this._tableAlias = options.tableAlias || null;
    this._limitKey = options.limitKey || DEFAULT_LIMIT_KEY;
    this._order = '';
    this._parseUuids = options.parseUuids === undefined ? true : options.parseUuids;
    this._autoParseStatements = options.autoParseStatements === undefined ? false : options.autoParseStatements;

    this._group = '';
    this._having = '';
  }

  /**
   * @method text
   *
   * @description
   * filter by text value, searches for value anywhere in the database attribute
   * alias for _addFilter method
   *
   * @param {String} filterKey    key attribute on filter object to be used in filter
   * @param {String} columnAlias  column to be used in filter query. This will default to
   *                              the filterKey if not set
   * @param {String} tableAlias   table to be used in filter query. This will default to
   *                              the object table alias if it exists
   */
  fullText(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);

    if (this._filters[filterKey]) {
      const searchString = `%${this._filters[filterKey]}%`;
      const preparedStatement = `LOWER(${tableString}${columnAlias}) LIKE ? `;

      this._addFilter(preparedStatement, searchString);
      delete this._filters[filterKey];
    }
  }

  period(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);

    if (this._filters[filterKey]) {
      // if a client timestamp has been passed - this will be passed in here
      const period = new Periods(this._filters.client_timestamp);
      const targetPeriod = period.lookupPeriod(this._filters[filterKey]);

      // specific base case - if all time requested to not apply a date filter
      if (targetPeriod === period.periods.allTime || targetPeriod === period.periods.custom) {
        delete this._filters[filterKey];
        return;
      }

      const periodFromStatement = `DATE(${tableString}${columnAlias}) >= DATE(?)`;
      const periodToStatement = `DATE(${tableString}${columnAlias}) <= DATE(?)`;

      this._addFilter(periodFromStatement, targetPeriod.limit.start());
      this._addFilter(periodToStatement, targetPeriod.limit.end());
      delete this._filters[filterKey];
    }
  }

  /**
   * @method dateFrom
   *
   * @param {String} filterKey    key attribute on filter object to be used in filter
   * @param {String} columnAlias  column to be used in filter query. This will default to
   *                              the filterKey if not set
   * @param {String} tableAlias   table to be used in filter query. This will default to
   *                              the object table alias if it exists
   */
  dateFrom(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);
    const timestamp = this._filters[filterKey];

    if (timestamp) {
      const preparedStatement = `DATE(${tableString}${columnAlias}) >= DATE(?)`;
      this._addFilter(preparedStatement, new Date(timestamp));
      delete this._filters[filterKey];
    }
  }

  /**
   * @method dateTo
   *
   * @param {String} filterKey    key attribute on filter object to be used in filter
   * @param {String} columnAlias  column to be used in filter query. This will default to
   *                              the filterKey if not set
   * @param {String} tableAlias   table to be used in filter query. This will default to
   *                              the object table alias if it exists
   */
  dateTo(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);
    const timestamp = this._filters[filterKey];

    if (timestamp) {
      const preparedStatement = `DATE(${tableString}${columnAlias}) <= DATE(?)`;
      this._addFilter(preparedStatement, new Date(timestamp));
      delete this._filters[filterKey];
    }
  }

  equals(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias, isArray = false) {
    const tableString = this._formatTableAlias(tableAlias);

    if (this._filters[filterKey]) {
      const valueString = '?';
      let preparedStatement = '';

      if (isArray) { // search in a list of values, example : where id in (1,2,3)
        preparedStatement = `${tableString}${columnAlias} IN (${valueString})`;
      } else { // search equals one value , example : where id = 2
        preparedStatement = `${tableString}${columnAlias} = ${valueString}`;
      }

      this._addFilter(preparedStatement, this._filters[filterKey]);
      delete this._filters[filterKey];
    }
  }

  /**
   * @method custom
   * @public
   *
   * @description
   * Allows a user to write custom SQL with either single or multiple
   * parameters.  The syntax is reminiscent of db.exec() in dealing with
   * arrays.
   */
  custom(filterKey, preparedStatement, preparedValue) {
    if (this._filters[filterKey]) {
      const searchValue = preparedValue || this._filters[filterKey];
      const isParameterArray = Array.isArray(searchValue);
      this._statements.push(preparedStatement);

      // gracefully handle array-like parameters by spreading them
      if (isParameterArray) {
        this._parameters.push(...searchValue);
      } else {
        this._parameters.push(searchValue);
      }

      delete this._filters[filterKey];
    }
  }

  /**
   * @method setOrder
   *
   * @description
   * Allows setting the SQL ordering on complex queries - this should be
   * exposed through the same interface as all other filters.
   */
  setOrder(orderString) {
    this._order = orderString;
  }

  /**
   * @method setGroup
   *
   * @description
   * Allows setting the SQL groups in the GROUP BY statement.  A developer is expected to
   * provide a valid SQL string.  This will be appended to the SQL statement after the
   * WHERE clause.
   */
  setGroup(groupString) {
    this._group = groupString;
  }

  /**
   * @method setHaving
   *
   * @description
   * Allows setting the SQL Having in the HAVING statement.  A developer is expected to
   * provide a valid SQL string.  This will be appended to the SQL statement after the
   * WHERE clause and/or GROUP BY
   */
  setHaving(havingClause) {
    this._having = havingClause;
  }

  applyQuery(sql, ignoreLimit = false) {
    // optionally call utility method to parse all remaining options as simple
    // equality filters into `_statements`
    const limitCondition = ignoreLimit ? '' : this._parseLimit();

    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }

    const conditionStatements = this._parseStatements();
    const order = this._order;
    const group = this._group;
    const having = this._having;

    // To prevent blank character when formatting SQL queries in case the HAVING clause is not needed
    const sqlQuery = having ? `${sql} WHERE ${conditionStatements} ${group} ${having} ${order} ${limitCondition}`
      : `${sql} WHERE ${conditionStatements} ${group} ${order} ${limitCondition}`;

    return sqlQuery;
  }

  parameters() {
    return this._parameters;
  }

  // this method only applies a table alias if it exists
  _formatTableAlias(table) {
    return table ? `${table}.` : '';
  }

  /**
   * @method _addFilter
   *
   * @description
   * Private method - populates the private statement and parameter variables
   */
  _addFilter(statement, parameter) {
    this._statements.push(statement);
    this._parameters.push(parameter);
  }

  /**
   * @method _parseDefaultFilters
   *
   * @description
   * Utility method for parsing any filters passed to the search that do not
   * have filter types - these always check for equality
   */
  _parseDefaultFilters() {
    // remove options that represent reserved keys
    this._filters = Object.fromEntries(
      Object.entries(this._filters).filter(([k]) => !RESERVED_KEYWORDS.includes(k)),
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(this._filters)) {

      let valueString = '?';
      const tableString = this._formatTableAlias(this._tableAlias);

      if (this._parseUuids) {
        // check to see if key contains the text uuid - if it does and parseUuids has
        // not been suppressed, automatically parse the value as binary
        if (key.includes(DEFAULT_UUID_PARTIAL_KEY)) {
          valueString = 'HUID(?)';
        }
      }

      this._addFilter(`${tableString}${key} = ${valueString}`, value);
    }
  }

  _parseStatements() {
    // this will always return true for a condition statement
    const DEFAULT_NO_STATEMENTS = '1';
    return this._statements.length === 0 ? DEFAULT_NO_STATEMENTS : this._statements.join(' AND ');
  }

  _parseLimit() {
    let limitString = '';
    const limit = Number(this._filters[this._limitKey]);

    if (limit) {
      limitString = `LIMIT ${limit} `;
    }

    return limitString;
  }

  /**
   * pagination handler
   */
  paginationLimitQuery(table, limit = 100, page = 1) {
    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }

    const conditionStatements = this._parseStatements();

    return `
      SELECT
        COUNT(*) AS total,
        ${page} AS page,
        ${limit} AS page_size, 
        (${(page - 1) * limit}) AS page_min, 
        (${(page) * limit}) AS page_max,
        CEIL(COUNT(*) / ${limit}) AS page_count
      ${table} 
      WHERE ${conditionStatements} 
    `;
  }

  // FIXME: This strategie is temp solution to fix the pager.total compare to the rows.size
  // The reason is we have to use COUNT(DISTINCT specific_column) FOR ALL OUR CASES in the above
  // query
  getAllResultQuery(sql) {
    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }
    const conditionStatements = this._parseStatements();

    const group = this._group;

    return `${sql} WHERE ${conditionStatements} ${group}`;
  }

  applyPaginationQuery(sql, limit, page) {
    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }

    const conditionStatements = this._parseStatements();
    const order = this._order;
    const group = this._group;

    return `${sql} WHERE ${conditionStatements} ${group} ${order} LIMIT ${limit} OFFSET ${page}`;
  }
}

module.exports = FilterParser;
