/**
 * @author sfount
 * @version 0.9.0
 * @date 30/08/2018
 * @description
 * - Performance improvements for `GenerateTransactionID()` SQL method
 * - Added additional transaction ID column to the `posting_journal`
 *   and `general_ledger` tables
 * - Added additional index to `posting_journal` and `general_ledger` tables
*/

-- SQL Function delimiter definition
DELIMITER $$ -- Add integer reference numbers to posting journal and general ledger
ALTER TABLE posting_journal
  ADD COLUMN trans_id_reference_number MEDIUMINT UNSIGNED NOT NULL,
  ADD INDEX (trans_id_reference_number);

ALTER TABLE general_ledger
  ADD COLUMN trans_id_reference_number MEDIUMINT UNSIGNED NOT NULL,
  ADD INDEX (trans_id_reference_number);

-- Populate new reference numbers using the existing String equivalent
UPDATE posting_journal SET trans_id_reference_number = SUBSTR(trans_id, 4);
UPDATE general_ledger SET trans_id_reference_number = SUBSTR(trans_id, 4);

-- Remove the current implementation of `GenerateTransactionId`
DROP FUNCTION GenerateTransactionId;

-- Implement the improved performance `GenerateTransactionId` function
-- (note_ the API will not change)
-- (note_ SUBSELECT vs. JOIN was tested, SUBSELECT was used because it works when there are no rows in journals
CREATE FUNCTION GenerateTransactionId(
  target_project_id SMALLINT(5)
)
RETURNS VARCHAR(100) DETERMINISTIC
BEGIN
  RETURN (
    SELECT CONCAT(
      (SELECT abbr AS project_string FROM project WHERE id = target_project_id),
      IFNULL(MAX(current_max) + 1, 1)
    ) AS id
    FROM (
      (
        SELECT trans_id_reference_number AS current_max
        FROM general_ledger
        WHERE project_id = target_project_id
        ORDER BY trans_id_reference_number DESC
        LIMIT 1
      )
      UNION
      (
        SELECT trans_id_reference_number AS current_max FROM posting_journal
        WHERE project_id = target_project_id
        ORDER BY trans_id_reference_number DESC
        LIMIT 1
      )
    )A
  );
END $$

-- Last updated 30/08/2018 23:53 @sfount

/*
@author jniles

@description
This file removes the previous version of the BUID() function, which was slow
and cumbersome, and replaces it with a faster version of itself.
*/

DELIMITER $$

DROP FUNCTION IF EXISTS BUID;

CREATE FUNCTION BUID(b BINARY(16))
RETURNS CHAR(32) DETERMINISTIC
BEGIN
  RETURN HEX(b);
END
$$

DELIMITER ;

/*
@author mbayopanda
@description adds the OHADA Bilan to the navigation tree.
*/
INSERT IGNORE INTO unit VALUES
  (206, '[OHADA] Bilan','TREE.OHADA_BALANCE_SHEET','',144,'/modules/reports/ohada_balance_sheet_report','/reports/ohada_balance_sheet_report');

/* Record the report */
INSERT IGNORE INTO `report` (`id`, `report_key`, `title_key`) VALUES
  (20, 'ohada_balance_sheet_report', 'REPORT.OHADA.BALANCE_SHEET');

/*
@author mbayopanda

@description
  ACCOUNT REFERENCE MODULE AND REPORT
  ===================================
  NOTE : Please create `account_reference` and `account_reference_item` tables first
*/

DROP TABLE IF EXISTS `account_reference_item`;
DROP TABLE IF EXISTS `account_reference`;

CREATE TABLE `account_reference` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `abbr` VARCHAR(35) NOT NULL,
  `description` VARCHAR(100) NOT NULL,
  `parent` MEDIUMINT(8) UNSIGNED NULL,
  `is_amo_dep` TINYINT(1) NULL DEFAULT 0 COMMENT 'Ammortissement or depreciation',
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_reference_1` (`abbr`, `is_amo_dep`)
) ENGINE=InnoDB;

CREATE TABLE `account_reference_item` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `is_exception` TINYINT(1) NULL DEFAULT 0 COMMENT 'Except this for reference calculation',
  PRIMARY KEY (`id`),
  KEY `account_reference_id` (`account_reference_id`),
  KEY `account_id` (`account_id`),
  FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`),
  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB;

INSERT IGNORE INTO unit VALUES
  (205, 'Account Reference Management','TREE.ACCOUNT_REFERENCE_MANAGEMENT','',1,'/modules/account_reference','/account_reference'),
  (206, '[OHADA] Bilan','TREE.OHADA_BALANCE_SHEET','',144,'/modules/reports/ohada_balance_sheet_report','/reports/ohada_balance_sheet_report'),
  (207, 'Account Reference Report','TREE.ACCOUNT_REFERENCE_REPORT','',144,'/modules/reports/account_reference','/reports/account_reference');

INSERT IGNORE INTO `report` (`id`, `report_key`, `title_key`) VALUES
  (20, 'ohada_balance_sheet_report', 'REPORT.OHADA.BALANCE_SHEET'),
  (21, 'account_reference', 'REPORT.ACCOUNT_REFERENCE.TITLE');


/*
@author jniles
@description
  UPDATE ENTERPRISE_SETTING TABLE
  ===============================

  ADD BALANCE ON INVOICE RECEIPT OPTION
  If yes, the balance will be displayed on the invoice as proof.
*/

ALTER TABLE `enterprise_setting` ADD COLUMN `enable_balance_on_invoice_receipt` TINYINT(1) NOT NULL DEFAULT 1;

/*
@author jniles
@description
Add stock accounting to the enterprise settings
*/

ALTER TABLE `enterprise_setting` ADD COLUMN `enable_auto_stock_accounting` TINYINT(1) NOT NULL DEFAULT 1;

/*
@author jniles
@description
Add enable barcodes setting to the enterprise settings
*/
ALTER TABLE `enterprise_setting` ADD COLUMN `enable_barcodes` TINYINT(1) NOT NULL DEFAULT 1;

/*
@author bruce
@description
Add stock import module in the navigation tree
*/
INSERT IGNORE INTO unit VALUES
(208, 'Import Stock From File','TREE.IMPORT_STOCK_FROM_FILE','',160,'/modules/stock/import','/stock/import');

/*
@author bruce
@description
Add created_at column in stock_movement for having the true date
*/
ALTER TABLE `stock_movement` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;


/*
@author bruce
@description
This procedure add missing stock movement reference inside the table document_map
it fixes the problem of nothing as reference in the stock movement registry
*/
DELIMITER $$

DROP PROCEDURE IF EXISTS AddMissingMovementReference$$
CREATE PROCEDURE AddMissingMovementReference()
BEGIN
  -- declaration
  DECLARE v_document_uuid BINARY(16);
  DECLARE v_reference INT(11);

  -- cursor variable declaration
  DECLARE v_finished INTEGER DEFAULT 0;

  -- cursor declaration
  DECLARE stage_missing_movement_document_cursor CURSOR FOR
    SELECT temp.document_uuid
  FROM missing_movement_document as temp;

  -- variables for the cursor
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_finished = 1;

  -- temporary table for movement which doesn't have movement reference identifier
  DROP TABLE IF EXISTS missing_movement_document;

  CREATE TEMPORARY TABLE missing_movement_document (
    SELECT m.document_uuid FROM stock_movement m
    LEFT JOIN document_map dm ON dm.uuid IS NULL
    GROUP BY m.document_uuid
  );

  -- open the cursor
  OPEN stage_missing_movement_document_cursor;

  -- loop inside the cursor
  missing_document : LOOP

    /* fetch data into variables */
    FETCH stage_missing_movement_document_cursor INTO v_document_uuid;

    IF v_finished = 1 THEN
      LEAVE missing_document;
    END IF;

    CALL ComputeMovementReference(v_document_uuid);

  END LOOP missing_document;

  -- close the cursor
  CLOSE stage_missing_movement_document_cursor;

  DROP TEMPORARY TABLE missing_movement_document;
END $$

/*
PROCEDURE UnbalancedInvoicePayments

USAGE: Call UnbalancedInvoicePayments(dateFrom, dateTo);

Description:
This SP retrieves the balance of invoices made during a period of time.  It
filters out invoices that are reversed (they should be balanced by default),
as well as balanced invoices.

*/
DROP PROCEDURE IF EXISTS UnbalancedInvoicePayments$$
CREATE PROCEDURE UnbalancedInvoicePayments(
  IN dateFrom DATE,
  IN dateTo DATE
) BEGIN

  -- this holds all the invoices that were made during the period
  -- two copies are needed for the UNION ALL query.
  DROP TABLE IF EXISTS tmp_invoices_1;
  CREATE TABLE tmp_invoices_1 (INDEX uuid (uuid)) AS
    SELECT invoice.uuid, invoice.debtor_uuid, invoice.date
    FROM invoice
    WHERE
      DATE(invoice.date) BETWEEN DATE(dateFrom) AND DATE(dateTo)
      AND reversed = 0
    ORDER BY invoice.date;

  DROP TABLE IF EXISTS tmp_invoices_2;
  CREATE TABLE tmp_invoices_2 AS SELECT * FROM tmp_invoices_1;

  -- This holds the invoices from the PJ/GL
  DROP TABLE IF EXISTS tmp_records;
  CREATE TABLE tmp_records AS
    SELECT ledger.record_uuid AS uuid, ledger.debit_equiv, ledger.credit_equiv
    FROM (
      SELECT pj.record_uuid, pj.debit_equiv, pj.credit_equiv
      FROM posting_journal pj
        JOIN tmp_invoices_1 i ON i.uuid = pj.record_uuid
          AND pj.entity_uuid = i.debtor_uuid

      UNION ALL

      SELECT gl.record_uuid, gl.debit_equiv, gl.credit_equiv
      FROM general_ledger gl
        JOIN tmp_invoices_2 i ON i.uuid = gl.record_uuid
            AND gl.entity_uuid = i.debtor_uuid
  ) AS ledger;

  -- this holds the references/payments against the invoices
  DROP TABLE IF EXISTS tmp_references;
  CREATE TABLE tmp_references AS
    SELECT ledger.reference_uuid AS uuid, ledger.debit_equiv, ledger.credit_equiv
    FROM (
      SELECT pj.reference_uuid, pj.debit_equiv, pj.credit_equiv
      FROM posting_journal pj
        JOIN tmp_invoices_1 i ON i.uuid = pj.reference_uuid
          AND pj.entity_uuid = i.debtor_uuid

      UNION ALL

      SELECT gl.reference_uuid, gl.debit_equiv, gl.credit_equiv
      FROM general_ledger gl
        JOIN tmp_invoices_2 i ON i.uuid = gl.reference_uuid
          AND gl.entity_uuid = i.debtor_uuid
  ) AS ledger;

  -- combine invoices and references to get the balance of each invoice.
  -- note that we filter out balanced invoices
  DROP TABLE IF EXISTS tmp_invoice_balances;
  CREATE TABLE tmp_invoice_balances AS
    SELECT z.uuid, SUM(z.debit_equiv) AS debit_equiv,
      SUM(z.credit_equiv) AS credit_equiv,
      SUM(z.debit_equiv) - SUM(z.credit_equiv) AS balance
    FROM (
      SELECT i.uuid, i.debit_equiv, i.credit_equiv FROM tmp_records i
      UNION ALL
      SELECT p.uuid, p.debit_equiv, p.credit_equiv FROM tmp_references p
    )z
    GROUP BY z.uuid
    HAVING balance <> 0;

  -- even though this column is called "balance", it is actually the amount remaining
  -- on the invoice.
  SELECT BUID(iv.debtor_uuid) AS debtor_uuid, balances.debit_equiv AS debit,
    balances.credit_equiv AS credit, iv.date AS creation_date, balances.balance,
    IFNULL(balances.credit_equiv / balances.debit_equiv, 0) AS paymentPercentage,
    dm.text AS reference
  FROM tmp_invoices_1 AS iv
    JOIN tmp_invoice_balances AS balances ON iv.uuid = balances.uuid
    LEFT JOIN document_map AS dm ON dm.uuid = iv.uuid
    JOIN debtor ON debtor.uuid = iv.debtor_uuid
    LEFT JOIN entity_map AS em ON em.uuid = iv.debtor_uuid
  ORDER BY iv.date;
END$$

DELIMITER ;

INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('income_expense_by_month', 'REPORT.INCOME_EXPENSE_BY_MONTH'),
  ('unbalanced_invoice_payments_report', 'REPORT.UNBALANCED_INVOICE_PAYMENTS_REPORT.TITLE'),
  ('account_report_multiple', 'REPORT.REPORT_ACCOUNTS_MULTIPLE.TITLE');

INSERT INTO `unit` VALUES
  (211, 'Income Expenses by month', 'TREE.INCOME_EXPENSE_BY_MONTH', 'The Report of income and expenses', 144, '/modules/finance/income_expense_by_month', '/reports/income_expense_by_month'),
  (212, 'Accounts Report multiple','TREE.REPORTS_MULTIPLE_ACCOUNTS','',144,'/modules/reports/account_report_multiple','/reports/account_report_multiple');
  (213, 'unbalanced invoice payments','REPORT.UNBALANCED_INVOICE_PAYMENTS_REPORT.TITLE','',144,'/modules/reports/unbalanced_invoice_payments_report','/reports/unbalanced_invoice_payments_report');

/*
@author jniles
@description
Fix reference_uuid index bug
@date 2018-10-02
*/
ALTER TABLE `general_ledger` DROP INDEX `reference_uuid`;
ALTER TABLE `posting_journal` DROP INDEX `reference_uuid`;
ALTER TABLE `posting_journal` ADD INDEX `reference_uuid` (`reference_uuid`);
ALTER TABLE `general_ledger` ADD INDEX `reference_uuid` (`reference_uuid`);

/*
@author bruce
@description person_category and person tables
@date 2018-10-04
*/
DROP TABLE IF EXISTS `entity_type`;
CREATE TABLE `entity_type` (
  `id` SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(190) NOT NULL,
  `translation_key` VARCHAR(190) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `entity`;
CREATE TABLE `entity` (
  `uuid`               BINARY(16) NOT NULL,
  `display_name`       VARCHAR(190) NOT NULL,
  `gender`             CHAR(1) NOT NULL,
  `email`              VARCHAR(150) NULL,
  `phone`              VARCHAR(50) NULL,
  `address`            VARCHAR(190) NULL,
  `entity_type_id`     SMALLINT(5) UNSIGNED NOT NULL,
  `reference`          INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reference`),
  UNIQUE KEY `entity_uuid` (`uuid`),
  UNIQUE KEY `display_name` (`display_name`),
  KEY `entity_type_id` (`entity_type_id`)
) ENGINE=InnoDB;

INSERT INTO unit VALUES
(210, 'Stock value Report','TREE.STOCK_VALUE','',144,'/modules/reports/stock_value','/reports/stock_value');

INSERT INTO `report` (`id`, `report_key`, `title_key`)
VALUES  (23, 'stock_value', 'TREE.STOCK_VALUE');


DELIMITER $$
/* report for stock movement */
/* retrieve the stock status( current qtt, unit_cost, value)for a specific inventory in a depot */

DROP PROCEDURE IF EXISTS `stockInventoryReport`$$
CREATE PROCEDURE `stockInventoryReport`(IN _inventory_uuid BINARY(16), IN  _depot_uuid BINARY(16), IN _dateTo DATE)
BEGIN
  DECLARE done BOOLEAN;
  DECLARE mvtIsExit, mvtQtt,  mvtUnitCost, mvtValue DECIMAL(19, 4);
  DECLARE newQuantity, newValue, newCost DECIMAL(19, 4);
  DECLARE stockQtt, stockUnitCost, stockValue DECIMAL(19, 4);
  DECLARE _documentReference VARCHAR(100);
  DECLARE _date DATETIME;

  DECLARE curs1 CURSOR FOR
    SELECT DISTINCT m.is_exit, l.unit_cost, m.quantity, m.date, dm.text AS documentReference
    FROM stock_movement m
    JOIN lot l ON l.uuid = m.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN inventory_unit iu ON iu.id = i.unit_id
    JOIN depot d ON d.uuid = m.depot_uuid
    LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
    WHERE i.uuid = _inventory_uuid AND m.depot_uuid = _depot_uuid AND DATE(m.date) <= _dateTo
    ORDER BY m.created_at ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  DROP TEMPORARY TABLE IF EXISTS stage_movement;
  CREATE TEMPORARY TABLE stage_movement(
    isExit TINYINT(1),
    qtt DECIMAL(19, 4),
    unit_cost DECIMAL(19, 4),
    value DECIMAL(19, 4),
    date DATETIME,
    reference VARCHAR(100),
    stockQtt DECIMAL(19, 4),
    stockUnitCost DECIMAL(19, 4),
    stockValue DECIMAL(19, 4)
  );

  SET stockQtt= 0;
  SET stockUnitCost = 0;
  SET stockValue = 0;

  OPEN curs1;
    read_loop: LOOP

    SET mvtIsExit = 0;
    SET mvtQtt = 0;
    SET mvtUnitCost = 0;
    SET mvtValue = 0;
    SET newQuantity = 0;
    SET newValue = 0;
    SET newCost = 0;

    FETCH curs1 INTO mvtIsExit, mvtUnitCost, mvtQtt, _date, _documentReference;
      IF done THEN
        LEAVE read_loop;
      END IF;

      IF mvtIsExit = 1 THEN
        SET stockQtt = stockQtt - mvtQtt;
        SET stockValue = stockQtt * stockUnitCost;
      ELSE
        SET newQuantity = mvtQtt + stockQtt;
        SET newValue = (mvtUnitCost * mvtQtt) + stockValue;
        SET newCost = newValue / IF(newQuantity = 0, 1, newQuantity);

        SET stockQtt = newQuantity;
        SET stockUnitCost = newCost;
        SET stockValue = newValue;
      END IF;

      INSERT INTO stage_movement VALUES(
        mvtIsExit, mvtQtt, stockQtt, mvtQtt*mvtUnitCost, _date, _documentReference,  stockQtt, stockUnitCost, stockValue
      );
    END LOOP;
CLOSE curs1;

SELECT  * FROM stage_movement;

END$$


/*   retrieve the stock status( current qtt, unit_cost, value) for each inventory in a depot */
DROP PROCEDURE IF EXISTS `stockValue`$$

CREATE PROCEDURE `stockValue`(IN _depot_uuid BINARY(16), IN _dateTo DATE)
BEGIN
  DECLARE done BOOLEAN;
  DECLARE mvtIsExit, mvtQtt,  mvtUnitCost, mvtValue DECIMAL(19, 4);
  DECLARE newQuantity, newValue, newCost DECIMAL(19, 4);
  DECLARE stockQtt, stockUnitCost, stockValue DECIMAL(19, 4);
  DECLARE _documentReference VARCHAR(100);
  DECLARE _date DATETIME;
  DECLARE _inventory_uuid BINARY(16);
  DECLARE _iteration, _newStock INT;


  DECLARE curs1 CURSOR FOR
    SELECT DISTINCT i.uuid, m.is_exit, l.unit_cost, m.quantity, m.date, dm.text AS documentReference
    FROM stock_movement m
    JOIN lot l ON l.uuid = m.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN inventory_unit iu ON iu.id = i.unit_id
    JOIN depot d ON d.uuid = m.depot_uuid
    LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
    WHERE m.depot_uuid = _depot_uuid AND DATE(m.date) <= _dateTo
    ORDER BY i.text, m.created_at ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  DROP TEMPORARY TABLE IF EXISTS stage_movement;
  CREATE TEMPORARY TABLE stage_movement(
    inventory_uuid BINARY(16),
    isExit TINYINT(1),
    qtt DECIMAL(19, 4),
    unit_cost DECIMAL(19, 4),
    VALUE DECIMAL(19, 4),
    DATE DATETIME,
    reference VARCHAR(100),
    stockQtt DECIMAL(19, 4),
    stockUnitCost DECIMAL(19, 4),
    stockValue DECIMAL(19, 4),
    iteration INT
  );

  OPEN curs1;
    read_loop: LOOP

    SET mvtIsExit = 0;
    SET mvtQtt = 0;
    SET mvtUnitCost = 0;
    SET mvtValue = 0;
    SET newQuantity = 0;
    SET newValue = 0;
    SET newCost = 0;

    FETCH curs1 INTO _inventory_uuid, mvtIsExit, mvtUnitCost, mvtQtt, _date, _documentReference;
      IF done THEN
        LEAVE read_loop;
      END IF;

      SELECT COUNT(inventory_uuid) INTO _newStock FROM stage_movement WHERE inventory_uuid = _inventory_uuid;
      -- set stock qtt, value and unit cost for a new inventory
      IF _newStock = 0 THEN
        SET stockQtt= 0;
        SET stockUnitCost = 0;
        SET stockValue = 0;
        SET _iteration = 0;
      END IF;

      -- stock exit movement, the stock quantity decreases
      IF mvtIsExit = 1 THEN
        SET stockQtt = stockQtt - mvtQtt;
        SET stockValue = stockQtt * stockUnitCost;
      ELSE
       -- stock exit movement, the stock quantity increases
        SET newQuantity = mvtQtt + stockQtt;
        SET newValue = (mvtUnitCost * mvtQtt) + stockValue;
        SET newCost = newValue / IF(newQuantity = 0, 1, newQuantity);

        SET stockQtt = newQuantity;
        SET stockUnitCost = newCost;
        SET stockValue = newValue;
      END IF;

      INSERT INTO stage_movement VALUES(
        _inventory_uuid, mvtIsExit, mvtQtt, stockQtt, mvtQtt*mvtUnitCost, _date, _documentReference,  stockQtt, stockUnitCost, stockValue, _iteration
      );
      SET _iteration = _iteration + 1;
    END LOOP;
  CLOSE curs1;

  DROP TEMPORARY TABLE IF EXISTS stage_movement_copy;
  CREATE TEMPORARY TABLE stage_movement_copy AS SELECT * FROM stage_movement;

  -- inventory stock
  SELECT  BUID(sm.inventory_uuid) AS inventory_uuid, i.text as inventory_name,  sm.stockQtt, sm.stockUnitCost, sm.stockValue
  FROM stage_movement sm
  JOIN inventory i ON i.uuid = sm.inventory_uuid
  INNER JOIN (
    SELECT inventory_uuid, MAX(iteration) as max_iteration
    FROM stage_movement_copy
    GROUP BY inventory_uuid
  )x ON x.inventory_uuid = sm.inventory_uuid AND x.max_iteration = sm.iteration

  ORDER BY i.text ASC;

  -- total in stock
  SELECT SUM(sm.stockValue) as total
  FROM stage_movement as sm
  INNER JOIN (
    SELECT inventory_uuid, MAX(iteration) as max_iteration
    FROM stage_movement_copy
    GROUP BY inventory_uuid
  )x ON x.inventory_uuid = sm.inventory_uuid AND x.max_iteration = sm.iteration;

END$$

DELIMITER ;

-- BY lomamech 2018-10-19
-- Added the credit_balance and debit_balance property
-- to account for certain account references that have a debit or credit balance
ALTER TABLE `account_reference_item` ADD COLUMN `credit_balance` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `account_reference_item` ADD COLUMN `debit_balance` TINYINT(1) NOT NULL DEFAULT 0;

INSERT INTO unit VALUES
  (213, '[OHADA] Compte de resultat','TREE.OHADA_RESULT_ACCOUNT','',144,'/modules/reports/ohada_profit_loss','/reports/ohada_profit_loss');

INSERT INTO `report` (`id`, `report_key`, `title_key`) VALUES
  (26, 'ohada_profit_loss', 'TREE.OHADA_RESULT_ACCOUNT');

/*
department management
*/
CREATE TABLE `department`(
  `uuid` BINARY(16),
  `name` VARCHAR(100) NOT NULL,
  `enterprise_id` smallINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY('uuid'),
  UNIQUE KEY  (`enterprise_id`, `name`),
  FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB;

-- units
INSERT INTO unit VALUES
  (214, 'Department management','TREE.DEPARTMENT_MANAGEMENT','Department Management', 1,'/modules/department/','/departments'),
  (215, 'Income Expenses by Year', 'TREE.INCOME_EXPENSE_BY_YEAR', 'The Report of income and expenses', 144, '/modules/finance/income_expense_by_year', '/reports/income_expense_by_year');

INSERT INTO `report` (`id`, `report_key`, `title_key`) VALUES
(27, 'income_expense_by_year', 'REPORT.INCOME_EXPENSE_BY_YEAR');

-- add the fiscal year changes
-- author: @jniles
DELIMITER $$

DROP PROCEDURE CreatePeriods$$
CREATE PROCEDURE CreatePeriods(
  IN fiscalYearId MEDIUMINT(8)
)
BEGIN
  DECLARE periodId MEDIUMINT(8);
  DECLARE periodNumber SMALLINT(5) DEFAULT 0;
  DECLARE periodStartDate DATE;
  DECLARE periodEndDate DATE;
  DECLARE periodLocked TINYINT(1);

  DECLARE fyEnterpriseId SMALLINT(5);
  DECLARE fyNumberOfMonths MEDIUMINT(8) DEFAULT 0;
  DECLARE fyLabel VARCHAR(50);
  DECLARE fyStartDate DATE;
  DECLARE fyEndDate DATE;
  DECLARE fyPreviousFYId SMALLINT(5);
  DECLARE fyLocked TINYINT(1);
  DECLARE fyCreatedAt TIMESTAMP;
  DECLARE fyUpdatedAt TIMESTAMP;
  DECLARE fyUserId MEDIUMINT(5);
  DECLARE fyNote TEXT;


  -- get the fiscal year informations
  SELECT
    enterprise_id, number_of_months, label, start_date, end_date,
    previous_fiscal_year_id, locked, created_at, updated_at, user_id, note
    INTO
    fyEnterpriseId, fyNumberOfMonths, fyLabel, fyStartDate, fyEndDate,
    fyPreviousFYId, fyLocked, fyCreatedAt, fyUpdatedAt, fyUserId, fyNote
  FROM fiscal_year WHERE id = fiscalYearId;

  -- insert N+1 period
  WHILE periodNumber <= fyNumberOfMonths + 1 DO

    IF periodNumber = 0 THEN
      -- Extremum periods 0 and N+1
      -- Insert periods with null dates - period id is YYYY00
      INSERT INTO period (`id`, `fiscal_year_id`, `number`, `start_date`, `end_date`, `locked`)
      VALUES (CONCAT(YEAR(fyStartDate), periodNumber), fiscalYearId, periodNumber, NULL, NULL, 0);

    ELSEIF periodNumber = fyNumberOfMonths + 1 THEN
      -- Extremum periods N+1
      -- Insert periods with null dates - period id is YYYY13
      INSERT INTO period (`id`, `fiscal_year_id`, `number`, `start_date`, `end_date`, `locked`)
      VALUES (CONCAT(YEAR(fyStartDate), periodNumber), fiscalYearId, periodNumber, NULL, NULL, 0);

    ELSE
      -- Normal periods
      -- Get period dates range
      CALL GetPeriodRange(fyStartDate, periodNumber, periodStartDate, periodEndDate);

      -- Inserting periods -- period id is YYYYMM
      INSERT INTO period(`id`, `fiscal_year_id`, `number`, `start_date`, `end_date`, `locked`)
      VALUES (DATE_FORMAT(periodStartDate, '%Y%m'), fiscalYearId, periodNumber, periodStartDate, periodEndDate, 0);
    END IF;

    SET periodNumber = periodNumber + 1;
  END WHILE;
END $$

DROP PROCEDURE CloseFiscalYear$$
CREATE PROCEDURE CloseFiscalYear(
  IN fiscalYearId MEDIUMINT UNSIGNED,
  IN closingAccountId INT UNSIGNED
)
BEGIN
  DECLARE NoSubsequentFiscalYear CONDITION FOR SQLSTATE '45010';
  DECLARE nextFiscalYearId MEDIUMINT UNSIGNED;
  DECLARE nextPeriodZeroId MEDIUMINT UNSIGNED;
  DECLARE currentFiscalYearClosingPeriod INT;

  DECLARE incomeAccountType SMALLINT;
  DECLARE expenseAccountType SMALLINT;

  -- constants
  SET incomeAccountType = 4;
  SET expenseAccountType = 5;

  -- find the subsequent fiscal year
  SET nextFiscalYearId = (
    SELECT id FROM fiscal_year
    WHERE previous_fiscal_year_id = fiscalYearId
    LIMIT 1
  );

  -- get the current fiscal year date
  SET currentFiscalYearClosingPeriod = (
    SELECT period.id FROM period WHERE period.fiscal_year_id = fiscalYearId ORDER BY period.number DESC LIMIT 1
  );

  IF nextFiscalYearId IS NULL THEN
    SIGNAL NoSubsequentFiscalYear
    SET MESSAGE_TEXT =
      'A fiscal year can only be closed into a subsequent fiscal year.  There is no following year for this fiscal year.';
  END IF;

  -- find the period id of the period 0 for the subsequent fiscal year
  SET nextPeriodZeroId = (
    SELECT period.id FROM period
    WHERE period.fiscal_year_id = nextFiscalYearId AND period.number = 0
  );

  -- create the fiscal year balances
  CREATE TEMPORARY TABLE FiscalYearBalances AS
    SELECT a.id, MAX(fy.id) AS fiscal_year_id, MAX(fy.enterprise_id) AS enterprise_id,
      SUM(pt.credit) AS credit, SUM(pt.debit) AS debit,
      SUM(pt.debit - pt.credit) AS balance, MAX(a.type_id) AS type_id
    FROM period_total AS pt
      JOIN account AS a ON pt.account_id = a.id
      JOIN account_type AS at ON a.type_id = at.id
      JOIN fiscal_year AS fy ON pt.fiscal_year_id = fy.id
    WHERE pt.fiscal_year_id = fiscalYearId
    GROUP BY a.id
    ORDER BY a.number;

  -- reverse the income/expense accounts in closing period into the closing account
  -- If they have a debit balance, credit them the difference, if they have a
  -- credit balance, debit them the difference
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT fyb.enterprise_id, fyb.fiscal_year_id, currentFiscalYearClosingPeriod, fyb.id,
    IF(fyb.debit > fyb.credit, fyb.debit - fyb.credit, 0),
    IF(fyb.debit < fyb.credit, fyb.credit - fyb.debit, 0)
  FROM FiscalYearBalances AS fyb
  WHERE fyb.type_id IN (incomeAccountType, expenseAccountType);

  -- sum all income/expense accounts from the fiscal year into the closing
  -- account in the closing period
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT fyb.enterprise_id, fyb.fiscal_year_id, currentFiscalYearClosingPeriod,
    closingAccountId, SUM(fyb.credit) credit, SUM(fyb.debit) debit
  FROM FiscalYearBalances AS fyb
  WHERE fyb.type_id IN (incomeAccountType, expenseAccountType)
  GROUP BY fyb.enterprise_id
  ON DUPLICATE KEY UPDATE credit = credit + VALUES(credit), debit = debit + VALUES(debit);

  -- copy all balances of non-income and non-expense accounts as the opening
  -- balance of the next fiscal year.  Leaving off the closing account, since it
  -- will be migrated from the closing period.
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT fyb.enterprise_id, nextFiscalYearId, nextPeriodZeroId, fyb.id,
    fyb.credit, fyb.debit
  FROM FiscalYearBalances AS fyb
  WHERE fyb.type_id NOT IN (incomeAccountType, expenseAccountType)
    AND fyb.id <> closingAccountId;

  -- now bring over the closing account from the closing period
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT enterprise_id, nextFiscalYearId, nextPeriodZeroId, account_id, credit, debit
  FROM period_total
  WHERE period_id = currentFiscalYearClosingPeriod
    AND account_id = closingAccountId;

  -- lock the fiscal year and associated periods
  UPDATE fiscal_year SET locked = 1 WHERE id = fiscalYearId;
  UPDATE period SET locked = 1 WHERE fiscal_year_id = fiscalYearId;
END $$

DELIMITER $$
/*
CALL UndoEntityReversal
DESCRIPTION:
Reset the reversed = 1 flag if an entity has been incorrectly reversed or an
operation that depends on reversal has failed
@TODO(sfount) A generic function for either setting or unsetting this flag would
              be prefered - new financial entities would have to be added to both
              this function and to ReverseTransaction
*/
CREATE PROCEDURE UndoEntityReversal(
  IN uuid BINARY(16)
)
BEGIN
  DECLARE isInvoice BOOLEAN;
  DECLARE isCashPayment BOOLEAN;
  DECLARE isVoucher BOOLEAN;
  SET isInvoice = (SELECT IFNULL((SELECT 1 FROM invoice WHERE invoice.uuid = uuid), 0));
  SET isVoucher = (SELECT IFNULL((SELECT 1 FROM voucher WHERE voucher.uuid = uuid), 0));
  -- avoid a scan of the cash table if we already know this is an invoice reversal
  IF NOT isInvoice THEN
    SET isCashPayment = (SELECT IFNULL((SELECT 1 FROM cash WHERE cash.uuid = uuid), 0));
  END IF;
  IF isInvoice THEN
    UPDATE invoice SET reversed = 0 WHERE invoice.uuid = uuid;
  END IF;
  -- make sure we update the cash payment that was reversed
  IF isCashPayment THEN
    UPDATE cash SET reversed = 0 WHERE cash.uuid = uuid;
  END IF;
  IF isVoucher THEN
    UPDATE voucher SET reversed = 0 where voucher.uuid = uuid;
  END IF;
END $$

CREATE TABLE `tags`(
  `uuid` BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  UNIQUE KEY  (`name`)
) ENGINE=InnoDB;

INSERT INTO unit VALUES
(217, 'Tags','TREE.TAGS','', 1,'/modules/tags/tags','/tags');

-- @jniles: remove project from role
ALTER TABLE role DROP INDEX project_role_label;
ALTER TABLE role DROP FOREIGN KEY `role_ibfk_1`;
ALTER TABLE role DROP column project_id;

-- @lomamech: add Unique Key in rubric_paiement

ALTER TABLE rubric_paiement
  ADD UNIQUE KEY `rubric_paiement_1` (`paiement_uuid`, `rubric_payroll_id`);


/*
@author lomamech

@description
  FEE CENTER MODULE AND REPORT
  ===================================
*/

DROP TABLE IF EXISTS `fee_center`;
CREATE TABLE `fee_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(190) NOT NULL,
  `is_principal` tinyint(1) UNSIGNED DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fee_center_1` (`label`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `reference_fee_center`;
CREATE TABLE `reference_fee_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `is_cost` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_fee_center_1` (`account_reference_id`),
  KEY `fee_center_id` (`fee_center_id`),
  KEY `account_reference_id` (`account_reference_id`),
  FOREIGN KEY (`fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `fee_center_distribution`;
CREATE TABLE `fee_center_distribution` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `row_uuid` BINARY(16) NOT NULL,
  `trans_id` VARCHAR(100) NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `is_cost` tinyint(1) DEFAULT 0,
  `auxiliary_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `debit_equiv` DECIMAL(19,8) NOT NULL DEFAULT 0.00,
  `credit_equiv` DECIMAL(19,8) NOT NULL DEFAULT 0.00,
  `date_distribution` DATETIME NOT NULL,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  INDEX `row_uuid` (`row_uuid`),
  INDEX `account_id` (`account_id`),
  INDEX `trans_id` (`trans_id`),
  INDEX `auxiliary_fee_center_id` (`auxiliary_fee_center_id`),
  INDEX `principal_fee_center_id` (`principal_fee_center_id`),
  FOREIGN KEY (`row_uuid`) REFERENCES `general_ledger` (`uuid`),
  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  FOREIGN KEY (`auxiliary_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`principal_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `service_fee_center`;
CREATE TABLE `service_fee_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `service_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_fee_center_1` (`service_id`),
  KEY `fee_center_id` (`fee_center_id`),
  KEY `service_id` (`service_id`),
  FOREIGN KEY (`service_id`) REFERENCES `service` (`id`),
  FOREIGN KEY (`fee_center_id`) REFERENCES `fee_center` (`id`)
) ENGINE=InnoDB;

-- units
INSERT INTO `unit` VALUES
  (218, 'Fee Center Management','TREE.COST_CENTER_MANAGEMENT','', 0,'/modules/fee_center','/fee_center'),
  (219, 'Fee Center Management','TREE.COST_CENTER','', 218,'/modules/fee_center','/fee_center'),
  (220, 'Distributions fees Centers','TREE.DITRIBUTION_AUX_FEES_CENTERS','', 218,'/modules/distribution_center','/distribution_center'),
  (221, 'Update Distributions','TREE.UPDATE_DISTRIBUTION','', 218,'/modules/distribution_center/update','/distribution_center/update'),
  (222, 'Fee Center Report', 'TREE.COST_CENTER_REPORT', 'Fee Center Report', 144, '/modules/reports/feeCenter', '/reports/feeCenter'),
  (223, 'Distribution keys', 'TREE.DISTRIBUTION_KEYS', 'Distribution keys', 218, '/modules/distribution_center/distribution_key', '/distribution_center/distribution_key');

-- core BHIMA reports
INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('feeCenter', 'REPORT.COST_CENTER.TITLE');

DROP TABLE IF EXISTS `distribution_key`;
CREATE TABLE `distribution_key` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `auxiliary_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `auxiliary_fee_center_id` (`auxiliary_fee_center_id`),
  INDEX `principal_fee_center_id` (`principal_fee_center_id`),
  FOREIGN KEY (`auxiliary_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`principal_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- author: @jniles
-- combine the two client reports into a single report
UPDATE report SET `report_key` = 'annual-clients-report', title_key = 'REPORT.CLIENTS.TITLE' WHERE id = 17;
UPDATE unit SET name = 'Annual Clients Report', `key` = 'REPORT.CLIENTS.TITLE',
  description = 'Annual Clients Report', parent = 144, url = '/modules/reports/clients', `path` = '/reports/annual-clients-report'
WHERE id = 199;

UPDATE role_unit SET unit_id = 199 WHERE unit_id = 159;
DELETE FROM unit WHERE id = 159;
DELETE FROM report WHERE id = 9;

INSERT INTO `account_reference_item`(`id`, `account_reference_id`, `account_id`, `is_exception`, `credit_balance`, `debit_balance`)
  VALUES (1,1,2958,0,0,0),(5,5,2996,0,0,0),(6,5,3012,0,0,0),(24,20,3282,0,0,0),(27,23,3346,0,0,0),(29,25,3390,0,0,0),(30,25,3382,0,0,0),(31,26,3385,0,0,0),(45,2,2973,0,0,0),(55,22,3351,0,0,0),(56,3,2967,0,0,0),(57,4,2984,0,0,0),(58,36,3292,0,0,0),(59,37,3321,0,0,0),(60,38,3355,0,0,0),(61,39,3385,0,0,0),(62,40,2987,0,0,0),(63,41,3036,0,0,0),(64,6,3058,0,0,0),(65,6,3100,0,0,0),(66,7,3132,0,0,0),(67,8,3158,0,0,0),(68,9,3178,0,0,0),(69,42,3390,0,0,0),(70,10,3234,0,0,0),(71,10,3260,0,0,0),(75,43,3372,0,0,0),(76,24,3407,0,0,0),(77,44,3387,0,0,0),(78,45,3218,0,0,0),(79,46,3277,0,0,0),(80,47,3415,0,0,0),(81,48,3425,0,0,0),(82,48,3436,0,0,0),(83,48,3442,0,0,0),(84,49,3411,0,0,0),(85,11,3419,0,0,0),(86,11,3431,0,0,0),(87,12,3447,0,0,0);

ALTER TABLE `patient_visit` ADD COLUMN `hospitalized` TINYINT(1) NOT NULL DEFAULT 0;

INSERT INTO unit VALUES
(224, 'Pavillions', 'TREE.PAVILLION', 'Pavillion Management', 1, '/modules/pavillions/', '/pavillions');
ALTER TABLE account DROP COLUMN `classe`;

-- author : @lomamech
-- Add new transaction type
-- 2018-12-10
INSERT INTO `transaction_type` (`text`, `type`, `fixed`) VALUES
  ('VOUCHERS.SIMPLE.TRANSFER_AUXILIARY', 'expense', 1),
  ('VOUCHERS.SIMPLE.RECEPTION_FUNDS_AUXILIARY', 'income', 1),
  ('VOUCHERS.SIMPLE.PROVISIONING_PRINCIPAL', 'income', 1),
  ('VOUCHERS.SIMPLE.TRANSFER_FUNDS_BANKS', 'expense', 1),
  ('VOUCHERS.SIMPLE.EXIT_FUNDS_BANK', 'expense', 1),
  ('VOUCHERS.SIMPLE.BANK_CASH_APPROVALS', 'income', 1);
-- author: @mbayopanda
-- stock assignment feature
-- the stock assign table
DROP TABLE IF EXISTS `stock_assign`;
CREATE TABLE `stock_assign` (
  `uuid`              BINARY(16) NOT NULL,
  `lot_uuid`          BINARY(16) NOT NULL,
  `entity_uuid`       BINARY(16) NOT NULL,
  `depot_uuid`        BINARY(16) NOT NULL,
  `quantity`          INT(11) NOT NULL DEFAULT 1,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `description`       TEXT NULL,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `lot_uuid` (`lot_uuid`),
  KEY `entity_uuid` (`entity_uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
  FOREIGN KEY (`entity_uuid`) REFERENCES `entity` (`uuid`),
  FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB;

-- update the lot table
ALTER TABLE lot ADD COLUMN `is_assigned` TINYINT(1) NULL DEFAULT 0;

-- the stock assignment unit
INSERT INTO unit VALUES
  (224, 'Stock Assignment','ASSIGN.STOCK_ASSIGN','', 160,'/modules/stock/assign','/stock/assign');

UPDATE unit SET `key` = 'REPORT.PROFIT_AND_LOSS' WHERE id = 180;
UPDATE unit SET `key` = 'REPORT.PROFIT_AND_LOSS_BY_MONTH' WHERE id = 211;
UPDATE unit SET `key` = 'REPORT.PROFIT_AND_LOSS_BY_YEAR' WHERE id = 216;

UPDATE report SET title_key = 'REPORT.PROFIT_AND_LOSS' WHERE id = 3;
UPDATE report SET title_key = 'REPORT.PROFIT_AND_LOSS_BY_MONTH' WHERE id = 24;
UPDATE report SET title_key = 'REPORT.PROFIT_AND_LOSS_BY_YEAR' WHERE id = 27;

ALTER TABLE `patient_group` MODIFY COLUMN `note` TEXT NULL;

DELETE FROM report WHERE id = 23;
INSERT INTO report VALUES  (23, 'unpaid-invoice-payments', 'REPORT.UNPAID_INVOICE_PAYMENTS_REPORT.TITLE');

UPDATE unit SET
  `name`='Unpaid Invoice Payments', `key`='REPORT.UNPAID_INVOICE_PAYMENTS_REPORT.TITLE', `url`='/modules/reports/unpaid-invoice-payments', `path`='/reports/unpaid-invoice-payments'
WHERE id = 213;

-- @lomamech 2019-01-21 Account Reference Type
DROP TABLE IF EXISTS `account_reference_type`;
CREATE TABLE `account_reference_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `fixed` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_reference_type_1` (`label`)
) ENGINE=InnoDB;

-- update the account_reference table
ALTER TABLE account_reference ADD COLUMN `reference_type_id` MEDIUMINT(8) UNSIGNED NULL;

-- Default Account Reference Type
INSERT INTO `account_reference_type` (`id`, `label`, `fixed`) VALUES
(1, 'FORM.LABELS.COST_CENTER', 1),
(2, 'FORM.LABELS.BALANCE_SHEET', 1),
(3, 'FORM.LABELS.PROFIT_LOSS', 1),
(4, 'FORM.LABELS.BREAK_EVEN', 1);

-- Account Reference Type unit
INSERT INTO unit VALUES
(225, 'Account Reference Type','TREE.ACCOUNT_REFERENCE_TYPE','Account Reference Type', 1,'/modules/account_reference_type','/account_reference_type');


DROP TABLE IF EXISTS `debtor_group_history`;
CREATE TABLE `debtor_group_history` (
  `uuid` BINARY(16) NOT NULL,
  `debtor_uuid` BINARY(16) DEFAULT NULL,
  `previous_debtor_group` BINARY(16) DEFAULT NULL,
  `next_debtor_group` BINARY(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` smallINT(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `debtor_uuid` (`debtor_uuid`),
  KEY `previous_debtor_group` (`previous_debtor_group`),
  KEY `next_debtor_group` (`next_debtor_group`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
  FOREIGN KEY (`previous_debtor_group`) REFERENCES `debtor_group` (`uuid`),
  FOREIGN KEY (`next_debtor_group`) REFERENCES `debtor_group` (`uuid`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;
