/**
 * Accounts References Computations
 */
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

/**
 * @function findFiscalYear
 * @param {number} periodId
 */
function findFiscalYear(periodId) {
  const sql = `
    SELECT fy.id, p.number AS period_number
    FROM fiscal_year fy
      JOIN period p ON p.fiscal_year_id = fy.id
    WHERE p.id = ?
  `;
  return db.one(sql, [periodId]);
}

/**
 * @method computeAllAccountReference
 *
 * @description
 * compute value of all account references and returns an array of all accounts reference
 * with their debit, credit and balance
 *
 * @param {number} periodId - the period needed
 */
async function computeAllAccountReference(periodId, referenceTypeId) {
  const glb = {};

  const options = {
    reference_type_id : referenceTypeId,
  };

  const filters = new FilterParser(options, { tableAlias : 'ar' });

  // get all references
  const queryAccountReferences = `
    SELECT ar.id, ar.abbr, ar.description, ar.is_amo_dep, ar.reference_type_id
    FROM account_reference ar
  `;
  filters.equals('reference_type_id');

  const fiscalYear = await findFiscalYear(periodId);
  glb.fiscalYear = fiscalYear;

  const query = filters.applyQuery(queryAccountReferences);
  const parameters = filters.parameters();

  const accountReferences = await db.exec(query, parameters);
  return Promise.all(accountReferences.map(ar => getValueForReference(
    ar.abbr,
    ar.is_amo_dep || 0,
    ar.description,
    glb.fiscalYear.period_number,
    glb.fiscalYear.id,
  ),
  ));
}

/**
 * @method computeSingleAccountReference
 *
 * @description
 * Returns the debit, credit and balance of the account reference given as an array
 *
 * @param {string} abbr - the reference of accounts. ex. AA or AX
 * @param {number} periodId - the period needed
 * @param {boolean} isAmoDep - the concerned reference is for amortissement, depreciation or provision
 */
async function computeSingleAccountReference(abbr, isAmoDep, periodId) {

  const queryAccountReference = `
    SELECT id, abbr, description, is_amo_dep FROM account_reference
    WHERE abbr = ? AND is_amo_dep = ?;
  `;

  const fiscalYear = await findFiscalYear(periodId);

  const { description } = await db.one(queryAccountReference, [abbr, isAmoDep]);
  return getValueForReference(
    abbr,
    isAmoDep || 0,
    description,
    fiscalYear.period_number,
    fiscalYear.id,
  );
}

/**
 * @method getValueForReference
 *
 * @description
 * Returns computed value of the reference in a given period and fiscal_year
 *
 * @param {number} fiscalYearId
 * @param {number} periodNumber
 * @param {string} abbr - the reference of accounts. ex. AA or AX
 * @param {boolean} isAmoDep - the concerned reference is for amortissement, depreciation or provision
 */
async function getValueForReference(abbr, isAmoDep, referenceDescription, periodNumber, fiscalYearId) {

  const queryTotals = `
    SELECT
      ? AS abbr,
      ? AS is_amo_dep,
      ? AS description,
      COALESCE(SUM(pt.debit), 0)                   AS debit,
      COALESCE(SUM(pt.credit), 0)                  AS credit,
      COALESCE(SUM(pt.debit - pt.credit), 0)       AS balance
    FROM period_total pt
    JOIN period p ON p.id = pt.period_id
    WHERE pt.fiscal_year_id = ?
      AND pt.locked = 0
      AND p.number BETWEEN 0 AND ?
      AND pt.account_id IN (/* expand account IDs here */);`;

  const accounts = await getAccountsForReference(abbr, isAmoDep);
  const accountIds = accounts.map(a => a.account_id);
  const parameters = [
    abbr,
    isAmoDep,
    referenceDescription,
    fiscalYearId,
    periodNumber,
    accountIds.length ? accountIds : null,
  ];

  return db.exec(queryTotals, parameters).then(values => values[0]);
}

/**
 * @method getAccountsForReference
 *
 * @description
 * Returns all accounts concerned by the reference without exception accounts
 *
 * @param {string} abbr - the reference of accounts. ex. AA or AX
 * @param {boolean} isAmoDep - the concerned reference is for amortissement, depreciation or provision
 */
function getAccountsForReference(abbr, isAmoDep = 0) {
  const sql = `
    SELECT DISTINCT
      a.id          AS account_id,
      a.number      AS account_number,
      a.type_id     AS account_type_id,
      a.hidden,
      a.locked
    FROM account a
    JOIN account_reference_item ari_inc
      ON LEFT(a.number, CHAR_LENGTH(ari_inc.number)) = ari_inc.number
    JOIN account_reference ar_inc
      ON ar_inc.id = ari_inc.account_reference_id
      AND ar_inc.abbr = ?
      AND ar_inc.is_amo_dep = ?
      AND ari_inc.is_exception = 0
    WHERE NOT EXISTS (
      SELECT 1
      FROM account_reference_item ari_exc
      JOIN account_reference ar_exc
        ON ar_exc.id = ari_exc.account_reference_id
        AND ar_exc.abbr = ar_inc.abbr
        AND ar_exc.is_amo_dep = ar_inc.is_amo_dep
      WHERE ari_exc.is_exception = 1
        AND LEFT(a.number, CHAR_LENGTH(ari_exc.number)) = ari_exc.number
    )
    ORDER BY CONVERT(a.number, CHAR(10));`;

  return db.exec(sql, [abbr, isAmoDep]);
}

function getAccountsConfigurationReferences(types) {
  const typesFormated = types;

  /**
   * Retrieving the elements that can determine the types of account references
   */
  const sqlGetReferenceType = `
    SELECT art.id AS reference_type_id, art.label AS reference_type_label
    FROM account_reference_type AS art
    WHERE art.id IN (?)
    ORDER BY art.id ASC;`;

  /**
   * Retrieving the elements of the account reference
   */
  const sqlGetReferenceGroup = `
    SELECT ar.id, ar.abbr, ar.description AS referenceGroup, ar.reference_type_id
    FROM account_reference AS ar
    JOIN account_reference_type AS art ON art.id = ar.reference_type_id
    WHERE art.id IN (?)
    ORDER BY ar.reference_type_id, ar.description ASC;
  `;

  /**
   * Retrieving all account numbers linked to account references related to
   * the budget analysis
   */
  const sqlGetReferenceAccount = `
    SELECT art.id AS reference_type_id, ar.description, ari.account_id, a.label,
      a.number, acc.number AS acc_number, acc.id AS acc_id, ar.id AS account_reference_id,
      acc.label AS acc_label
    FROM account_reference_type AS art
    JOIN account_reference AS ar ON ar.reference_type_id = art.id
    JOIN account_reference_item AS ari ON ari.account_reference_id = ar.id
    JOIN account AS a ON a.id = ari.account_id
    JOIN account AS acc ON acc.number LIKE CONCAT(a.number, '%')
    WHERE art.id IN (?) AND ari.is_exception = 0 AND acc.type_id <> 6
    ORDER BY art.id, ar.id ASC;`;

  /**
   * Obtention des tous les numeros des comptes liees à exclure respectivement aux references des comptes
   * Correspondante */
  const sqlGetException = `
    SELECT art.id AS reference_type_id, ar.description, ari.account_id, a.label,
      a.number, acc.number AS acc_number, acc.id AS acc_id, ar.id AS account_reference_id
    FROM account_reference_type AS art
    JOIN account_reference AS ar ON ar.reference_type_id = art.id
    JOIN account_reference_item AS ari ON ari.account_reference_id = ar.id
    JOIN account AS a ON a.id = ari.account_id
    JOIN account AS acc ON acc.number LIKE CONCAT(a.number, '%')
    WHERE art.id IN (?) AND ari.is_exception = 1 AND acc.type_id <> 6
    ORDER BY art.id, ar.id ASC;
  `;

  return Promise.all([
    db.exec(sqlGetReferenceType, [typesFormated]),
    db.exec(sqlGetReferenceGroup, [typesFormated]),
    db.exec(sqlGetReferenceAccount, [typesFormated]),
    db.exec(sqlGetException, [typesFormated]),
  ]);
}

exports.getAccountsForReference = getAccountsForReference;
exports.computeSingleAccountReference = computeSingleAccountReference;
exports.getValueForReference = getValueForReference;
exports.computeAllAccountReference = computeAllAccountReference;
exports.getAccountsConfigurationReferences = getAccountsConfigurationReferences;
