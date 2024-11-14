const debug = require('debug')('db:transaction');
const { setTimeout: setTimeoutPromise } = require('node:timers/promises');

/** @const the number of times a transaction is restarted in case of deadlock */
const MAX_TRANSACTION_DEADLOCK_RESTARTS = 5;

/** @const the number of milliseconds delayed before restarting the transaction */
const TRANSACTION_DEADLOCK_RESTART_DELAY = 50;

/**
 * @class Transaction
 *
 * @description
 * Wraps transaction logic in a promise to handle rollback and commits as a
 * single transactional entity.
 *
 * Note that this module is required by the bhima
 * database connector and will be exposed via a public API there - controllers
 * should not be using this directly.
 *
 * @requires debug
 *
 * @example
 * const db = require('db');
 * let transaction = new Transaction(db);
 * transaction
 *   .addQuery('SELECT 1;')
 *   .addQuery('SELECT 2;')
 *   .execute()
 *   .then(results => console.log(results))
 *   .catch(error => console.error(error));
 */
class Transaction {
  /**
   * @constructor
   *
   * @param {Function|Object} db - the database connector (@see db)
   */
  constructor(db) {
    this.queries = [];
    this.db = db;
    this.restarts = 0;
    debug('#constructor(): initializing transaction...');
  }

  /**
   * @method addQuery
   *
   * @param {String} query - the SQL template string to be passed to the
   * connection.query() method.
   * @param {Object|Array|Undefined} params - the parameters to be templated
   * into the query string.
   * @returns this;
   *
   * @example
   * const transaction = new Transaction(db);
   * transaction
   *
   *   // this query has no parameters
   *   .addQuery('SELECT 1')
   *
   *   // this query uses an array of parameters
   *   .addQuery('SELECT column AS name FROM table WHERE id = ?', [1]);
   */
  addQuery(query, params) {
    this.queries.push({ query, params });
    return this;
  }

  /**
   * @method execute
   *
   * @description
   * Executes the query chain in a transaction.  To accomplish this, the
   * transaction opens up a transaction on the database connection, maps all
   * queries to executed promises, and returns the results.  The connection is
   * destroyed after this method is called.
   *
   * @returns {Promise} - the results of the transaction execution
   */
  async execute() {
    debug(`#execute(): Executing ${this.queries.length} queries.`);

    const { queries } = this;
    const { pool } = this.db;

    let connection;
    const rows = [];

    try {
      connection = await pool.getConnection();
      debug(`#execute(): DB connection acquired from pooled connections.`);

      // MySQL2 doesn't have support for .beginTransaction()
      await connection.query('START TRANSACTION;');
      debug('#execute(): Starting transaction...');

      debug(`#execute(): Executing ${queries.length} queries.`);

      const results = [];
      for (const stmt of queries) { // eslint-disable-line
        const [values, metadata] = await connection.query(stmt.query, stmt.params);
        rows.push(values);
      }

      debug('#execute(): All queries settled, commiting transaction.');

      await connection.query('COMMIT;');

      debug('#execute(): Transaction commited. Closing connections.');

    } catch (error) {
      debug('#execute(): An error occured in the transaction. Rolling back.');
      debug('#execute(): %o', error);

      await connection.query('ROLLBACK;');

      // increment the number of restarts
      this.restarts += 1;

      const isDeadlock = (error.code === 'ER_LOCK_DEADLOCK');

      // propogate error if not a transaction deadlock
      if (!isDeadlock) { throw error; }

      // restart transactions a set number of times if the error is due to table deadlocks
      if (isDeadlock && this.restarts < MAX_TRANSACTION_DEADLOCK_RESTARTS) {
        debug(`#execute(): Txn deadlock!  Restarts: ${this.restarts} of ${MAX_TRANSACTION_DEADLOCK_RESTARTS}.`);
        debug(`#execute(): Reattempt transaction after ${TRANSACTION_DEADLOCK_RESTART_DELAY}ms.`);

        // restart transaction after a delay
        return setTimeout(
          () => { this.execute(); },
          TRANSACTION_DEADLOCK_RESTART_DELAY);
      }

      // if we get here, all attempted restarts failed.  Report an error in case tables are permanently locked.
      if (isDeadlock) {
        debug('#execute(): Unrecoverable deadlock error.');
        debug(`#execute(): Completed ${this.restarts} / ${MAX_TRANSACTION_DEADLOCK_RESTARTS} restarts.`);
        debug('#execute(): Transaction will not be reattempted.');
        throw error;
      }
    } finally {
      // for some reason, we used connection.destroy() in the old code.
      // I believe that it cleans up things like temporary tables
      // e.g. if you change this to "release" instead of "destroy",
      // the trial balance tests do not pass.
      if (connection && connection.destroy) {
        debug(`#execute(): releasing connection back to the pool.`);
        connection.destroy();
      }
    }

    return rows;
  }
}

module.exports = Transaction;
