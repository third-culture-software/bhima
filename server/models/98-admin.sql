DELIMITER $$

/*
 zRecomputeEntityMap

 Abolishes and recomputes the entity_map from the base tables in the system.  This is
 useful in case of database corruption in which references get out of sync.
*/
CREATE PROCEDURE zRecomputeEntityMap()
BEGIN
  DELETE FROM entity_map;

  -- patient
  INSERT INTO entity_map
    SELECT patient.uuid, CONCAT_WS('.', 'PA', project.abbr, patient.reference)
    FROM patient JOIN project ON patient.project_id = project.id;

  -- patient debtor
  INSERT INTO entity_map
    SELECT patient.debtor_uuid, CONCAT_WS('.', 'PA', project.abbr, patient.reference)
    FROM patient JOIN project ON patient.project_id = project.id;

  -- employee
  INSERT INTO entity_map
    SELECT employee.creditor_uuid, CONCAT_WS('.', 'EM', enterprise.abbr, employee.reference)
    FROM employee
    JOIN patient ON patient.uuid = employee.patient_uuid
    JOIN project ON project.id = patient.project_id
    JOIN enterprise ON enterprise.id = project.enterprise_id;

  -- supplier
  INSERT INTO entity_map
    SELECT supplier.creditor_uuid, CONCAT_WS('.', 'FO', supplier.reference) FROM supplier;
END $$

/*
 zRecomputeDocumentMap

 Abolishes and recomputes the document_map entries from the base tables in the
 database.  This is useful in case of data corruption.
*/
CREATE PROCEDURE zRecomputeDocumentMap()
BEGIN
  DELETE FROM document_map;

  -- cash payments
  INSERT INTO document_map
    SELECT cash.uuid, CONCAT_WS('.', 'CP', project.abbr, cash.reference)
    FROM cash JOIN project where project.id = cash.project_id;

  -- invoices
  INSERT INTO document_map
    SELECT invoice.uuid, CONCAT_WS('.', 'IV', project.abbr, invoice.reference)
    FROM invoice JOIN project where project.id = invoice.project_id;

  -- purchases
  INSERT INTO document_map
    SELECT purchase.uuid, CONCAT_WS('.', 'PO', project.abbr, purchase.reference)
    FROM purchase JOIN project where project.id = purchase.project_id;

  -- vouchers
  INSERT INTO document_map
    SELECT voucher.uuid, CONCAT_WS('.', 'VO', project.abbr, voucher.reference)
    FROM voucher JOIN project where project.id = voucher.project_id;

  -- stock_requisition
  INSERT INTO document_map
    SELECT stock_requisition.uuid, CONCAT_WS('.', 'SREQ', project.abbr, stock_requisition.reference)
    FROM stock_requisition JOIN project where project.id = stock_requisition.project_id;

  -- stock movements
  INSERT INTO `document_map`
    SELECT sm.document_uuid, CONCAT_WS('.', 'SM', sm.flux_id, sm.reference)
    FROM stock_movement sm
    ON DUPLICATE KEY UPDATE uuid = sm.document_uuid;
END $$

/*
 zRepostVoucher

 Removes the voucher record from the posting_journal and calls the PostVoucher() method on
 the record in the voucher table to re-post it to the journal.
*/
CREATE PROCEDURE zRepostVoucher(
  IN vUuid BINARY(16)
)
BEGIN
  DELETE FROM posting_journal WHERE posting_journal.record_uuid = vUuid;
  CALL PostVoucher(vUuid);
END $$

/*
 zRepostInvoice

 Removes the invoice record from the posting_journal and calls the PostInvoice() method on
 the record in the invoice table to re-post it to the journal.
*/
CREATE PROCEDURE zRepostInvoice(
  IN iUuid BINARY(16)
)
BEGIN
  DELETE FROM posting_journal WHERE posting_journal.record_uuid = iUuid;
  CALL PostInvoice(iUuid);
END $$

/*
 zRepostCash

 Removes the cash record from the posting_journal and calls the PostCash() method on
 the record in the cash table to re-post it to the journal.
*/
CREATE PROCEDURE zRepostCash(
  IN cUuid BINARY(16)
)
BEGIN
  DELETE FROM posting_journal WHERE posting_journal.record_uuid = cUuid;
  CALL VerifyCashTemporaryTables();
  CALL PostCash(cUuid);
END $$

/*
 zRecalculatePeriodTotals

 Removes all data from the period_total table and rebuilds it.
*/
CREATE PROCEDURE zRecalculatePeriodTotals()
BEGIN

  -- wipe the period total table
  DELETE FROM  period_total
  WHERE period_id IN (
    SELECT id
    FROM period
    WHERE number <> 0
  );

  INSERT INTO period_total (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
    SELECT project.enterprise_id, period.fiscal_year_id, period_id, account_id, SUM(credit_equiv) AS credit, SUM(debit_equiv) AS debit
    FROM general_ledger
      JOIN period ON general_ledger.period_id = period.id
      JOIN project ON general_ledger.project_id = project.id
    GROUP BY account_id, period_id, fiscal_year_id, enterprise_id;

END $$


CREATE PROCEDURE zUpdatePatientText()
BEGIN
  UPDATE `debtor` JOIN `patient` ON debtor.uuid = patient.debtor_uuid
    SET debtor.text = CONCAT('Patient/', patient.display_name);
END $$

/*
CALL zMergeServices(fromId, toId);

DESCRIPTION
Merges two services by changing the service_uuid pointers to the new service and
then removing the previous service.
*/
DROP PROCEDURE IF EXISTS zMergeServices$$
CREATE PROCEDURE zMergeServices(
  IN from_service_uuid BINARY(16),
  IN to_service_uuid BINARY(16)
) BEGIN

  UPDATE invoice SET service_uuid = to_service_uuid WHERE service_uuid = from_service_uuid;
  UPDATE employee SET service_uuid = to_service_uuid WHERE service_uuid = from_service_uuid;
  UPDATE patient_visit_service SET service_uuid = to_service_uuid WHERE service_uuid = from_service_uuid;
  UPDATE ward SET service_uuid = to_service_uuid WHERE service_uuid = from_service_uuid;
  UPDATE service_cost_center SET service_uuid = to_service_uuid WHERE service_uuid = from_service_uuid;
  UPDATE indicator SET service_uuid = to_service_uuid WHERE service_uuid = from_service_uuid;
  DELETE FROM service WHERE id = from_service_uuid;
END $$

/*
CALL zMergeAccounts(fromId, toId);

DESCRIPTION
Merges two accounts by changing the account_id pointers to the new account and removing
the old one.  NOTE - you must call zRecalculatePeriodTotals() when all done with these
operations.  It isn't called here to allow operations to be batched for performance, then
committed.
*/
DROP PROCEDURE IF EXISTS zMergeAccounts $$
CREATE PROCEDURE zMergeAccounts(
  IN from_account_number TEXT,
  IN to_account_number TEXT
) BEGIN
  DECLARE from_account_id MEDIUMINT;
  DECLARE to_account_id MEDIUMINT;

  SET from_account_id = (SELECT id FROM account WHERE number = from_account_number);
  SET to_account_id = (SELECT id FROM account WHERE number = to_account_number);

  UPDATE general_ledger SET account_id = to_account_id WHERE account_id = from_account_id;
  UPDATE posting_journal SET account_id = to_account_id WHERE account_id = from_account_id;
  UPDATE voucher_item SET account_id = to_account_id WHERE account_id = from_account_id;
  DELETE FROM period_total where account_id = from_account_id;
  DELETE FROM account WHERE id = from_account_id;
END $$

/*
CALL zRecomputeStockMovementStatus()

DESCRIPTION
Recomputes the entire stock movement status table from the beginning
of time.
*/
DROP PROCEDURE IF EXISTS zRecomputeStockMovementStatus $$
CREATE PROCEDURE zRecomputeStockMovementStatus()
BEGIN

  DECLARE start_date DATE;
  DECLARE _depot_uuid BINARY(16);
  DECLARE done BOOLEAN DEFAULT FALSE;

  DECLARE depot_cursor CURSOR FOR
    SELECT depot.uuid FROM depot;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  SET start_date = (SELECT MIN(DATE(date)) FROM stock_movement);

  OPEN depot_cursor;
  read_loop: LOOP
    FETCH depot_cursor INTO _depot_uuid;
    IF done THEN
      LEAVE read_loop;
    END IF;
    CREATE TEMPORARY TABLE `stage_inventory_for_amc` AS SELECT DISTINCT inventory_uuid FROM lot;
    CALL ComputeStockStatusForStagedInventory(start_date, _depot_uuid);
  END LOOP;

  CLOSE depot_cursor;
END $$


DROP PROCEDURE IF EXISTS  zUnpostRecord $$
CREATE PROCEDURE zUnpostRecord(
  IN _record_uuid BINARY(16)
)
BEGIN
  INSERT INTO posting_journal
    SELECT * FROM general_ledger WHERE record_uuid = _record_uuid;

  DELETE FROM general_ledger WHERE record_uuid = _record_uuid;
END$$

DROP PROCEDURE IF EXISTS  zMergeDepots$$
CREATE PROCEDURE zMergeDepots(
  IN _old_uuid BINARY(16),
  IN _new_uuid BINARY(16)
) BEGIN
  UPDATE stock_movement SET depot_uuid = _new_uuid WHERE depot_uuid = _old_uuid;
  DELETE FROM depot_distribution_permission WHERE depot_uuid = _old_uuid;
  UPDATE stock_assign SET depot_uuid = _new_uuid WHERE depot_uuid = _old_uuid;
  UPDATE stock_requisition SET depot_uuid = _new_uuid WHERE depot_uuid = _old_uuid;
  DELETE FROM stock_movement_status WHERE depot_uuid =  _old_uuid;
  DELETE FROM depot_permission WHERE depot_uuid =  _old_uuid;
  DELETE FROM depot WHERE uuid =  _old_uuid;
END$$

/*
 zRecalculateCostCenterAggregates

 Removes all data from the cost_center_aggregate table and rebuilds it.
*/
DROP PROCEDURE IF EXISTS zRecalculateCostCenterAggregates$$
CREATE PROCEDURE zRecalculateCostCenterAggregates()
BEGIN

  -- wipe the cost_center_aggregate table
  DELETE FROM cost_center_aggregate;

  -- regenerate
  INSERT INTO cost_center_aggregate (period_id, credit, debit, cost_center_id, is_income)
    SELECT
      gl.period_id,
      SUM(gl.credit_equiv) AS credit,
      SUM(gl.debit_equiv) AS debit,
      gl.cost_center_id,
      IF(a.type_id = 4, 1, 0) AS is_income
    FROM general_ledger gl
    JOIN account a ON a.id = gl.account_id
    WHERE gl.cost_center_id IS NOT NULL
    GROUP BY gl.cost_center_id, gl.period_id, a.type_id;
END $$

/*
  zRecomputeLotBarcodes()

  Recomputes the lot barcodes from the base data.
*/
DROP PROCEDURE IF EXISTS zRecomputeLotBarcodes$$
CREATE PROCEDURE zRecomputeLotBarcodes()
BEGIN
  UPDATE lot SET barcode = CONCAT('LT', LEFT(HEX(lot.uuid), 8));
END $$

/**
 zGetInvoiceBalance()

 Gets the balance on an invoice due to a debtor.
*/
DROP FUNCTION IF EXISTS zGetInvoiceBalance$$
CREATE FUNCTION zGetInvoiceBalance(invoiceUuid BINARY(16))
RETURNS DOUBLE DETERMINISTIC
BEGIN
  DECLARE entityUuid BINARY(16);

  -- get the debtorUuid
  SELECT debtor_uuid INTO entityUuid FROM invoice WHERE invoice.uuid = invoiceUuid;

  --  return the balance
  RETURN (
    SELECT SUM(debit - credit) AS balance
    FROM (
      SELECT record_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
      FROM posting_journal
      WHERE posting_journal.record_uuid = invoiceUuid AND entity_uuid = entityUuid

      UNION ALL

      SELECT record_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
       FROM  general_ledger
       WHERE general_ledger.record_uuid = invoiceUuid AND entity_uuid = entityUuid

       UNION ALL

      SELECT reference_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
      FROM posting_journal
      WHERE posting_journal.reference_uuid = invoiceUuid AND entity_uuid = entityUuid

      UNION ALL

      SELECT reference_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
      FROM general_ledger
      WHERE general_ledger.reference_uuid = invoiceUuid AND entity_uuid = entityUuid
    ) AS ledger
    GROUP BY ledger.uuid
  );
END $$


/**
* DEPRECATED.
*
* Random stock procedures.  I'm not sure if they are actually being used
* in the application - I cannot find them.
*/

-- sum of a column of indexes (index for each employee)
DROP FUNCTION IF EXISTS `sumTotalIndex`$$
CREATE FUNCTION `sumTotalIndex`(_payroll_configuration_id INT, _indice_type VARCHAR(50)) RETURNS DECIMAL(19, 4) DETERMINISTIC
BEGIN

    DECLARE _employee_uuid BINARY(16);
    DECLARE _employee_grade_indice, totals DECIMAL(19, 4);

  SET totals  = (
    SELECT SUM(rubric_value) as 'rubric_value'
        FROM stage_payment_indice sp
        JOIN rubric_payroll r ON r.id = sp.rubric_id
        WHERE  r.indice_type = _indice_type AND  payroll_configuration_id = _payroll_configuration_id
  );

    RETURN IFNULL(totals, 1);
END$$

DROP FUNCTION IF EXISTS `getStagePaymentIndice`$$
CREATE  FUNCTION `getStagePaymentIndice`(_employee_uuid BINARY(16),
_payroll_configuration_id INT, _indice_type VARCHAR(50) ) RETURNS DECIMAL(19, 4) DETERMINISTIC
BEGIN
    RETURN IFNULL((SELECT SUM(rubric_value) as 'rubric_value'
        FROM stage_payment_indice sp
        JOIN rubric_payroll r ON r.id = sp.rubric_id
        WHERE sp.employee_uuid = _employee_uuid AND r.indice_type = _indice_type AND
            payroll_configuration_id = _payroll_configuration_id
        LIMIT 1), 0);
END;


/**
* Migration functions
*
* These functions are used in myigration scripts to add or drop columns when
* necessary.
*/

-- from https://stackoverflow.com/questions/173814/using-alter-to-drop-a-column-if-it-exists-in-mysql
DROP FUNCTION IF EXISTS bh_column_exists;

CREATE FUNCTION bh_column_exists(
  tname VARCHAR(64) ,
  cname VARCHAR(64)
)
  RETURNS BOOLEAN
  READS SQL DATA
  BEGIN
    RETURN 0 < (SELECT COUNT(*)
      FROM `INFORMATION_SCHEMA`.`COLUMNS`
      WHERE `TABLE_SCHEMA` = SCHEMA()
        AND `TABLE_NAME` = tname
        AND `COLUMN_NAME` = cname);
  END $$

-- drop_column_if_exists:

DROP PROCEDURE IF EXISTS drop_column_if_exists;

CREATE PROCEDURE drop_column_if_exists(
  IN tname VARCHAR(64),
  IN cname VARCHAR(64)
)
BEGIN
    IF bh_column_exists(tname, cname)
    THEN
      SET @drop_column_if_exists = CONCAT("ALTER TABLE `", tname, "` DROP COLUMN `", cname, "`");
      PREPARE drop_query FROM @drop_column_if_exists;
      EXECUTE drop_query;
    END IF;
END $$

-- add_column_if_missing:

DROP PROCEDURE IF EXISTS add_column_if_missing;
CREATE PROCEDURE add_column_if_missing(
  IN tname VARCHAR(64),
  IN cname VARCHAR(64),
  IN typeinfo VARCHAR(128)
)
BEGIN
  IF NOT bh_column_exists(tname, cname)
  THEN
    SET @add_column_if_missing = CONCAT("ALTER TABLE `", tname, "` ADD COLUMN `", cname, "` ", typeinfo);
    PREPARE add_query FROM @add_column_if_missing;
    EXECUTE add_query;
  END IF;
END $$

DROP FUNCTION IF EXISTS index_exists;
CREATE FUNCTION index_exists(
  theTable VARCHAR(64),
  theIndexName VARCHAR(64)
)
  RETURNS BOOLEAN
  READS SQL DATA
  BEGIN
    RETURN 0 < (SELECT COUNT(*) AS exist FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE() and table_name =
theTable AND index_name = theIndexName);
  END $$

DROP PROCEDURE IF EXISTS drop_index_if_exists $$
CREATE PROCEDURE drop_index_if_exists(in theTable varchar(128), in theIndexName varchar(128) )
BEGIN
 IF(index_exists (theTable, theIndexName)) THEN
   SET @s = CONCAT('DROP INDEX ' , theIndexName , ' ON ' , theTable);
   PREPARE stmt FROM @s;
   EXECUTE stmt;
 END IF;
END $$

DROP FUNCTION IF EXISTS Constraint_exists$$
CREATE FUNCTION Constraint_exists(
  theTable VARCHAR(64),
  theConstraintName VARCHAR(64)
)
  RETURNS BOOLEAN
  READS SQL DATA
  BEGIN
    RETURN 0 < (
     SELECT COUNT(*) AS nbr
     FROM
      INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME= theTable
    AND  CONSTRAINT_NAME = theConstraintName
   );
  END $$

DROP PROCEDURE IF EXISTS add_constraint_if_missing$$
CREATE PROCEDURE add_constraint_if_missing(
  IN tname VARCHAR(64),
  IN cname VARCHAR(64),
  IN cdetails VARCHAR(128)
)
BEGIN
  IF NOT Constraint_exists(tname, cname)
  THEN
    SET @add_constraint_if_missing = CONCAT("ALTER TABLE `", tname, "` ADD CONSTRAINT `", cname, "` ", cdetails);
    PREPARE add_query FROM @add_constraint_if_missing;
    EXECUTE add_query;
  END IF;
END $$

-- this procedure will be used for "ALTER TABLE table_name DROP FOREIGN KEY constraint_name";
-- example : CALL drop_foreign_key('table_name', 'constraint_name');

DROP PROCEDURE IF EXISTS drop_foreign_key $$
CREATE PROCEDURE drop_foreign_key(in theTable varchar(128), in theConstraintName varchar(128) )
BEGIN
 IF(Constraint_exists(theTable, theConstraintName) > 0) THEN

   SET @s = CONCAT(' ALTER TABLE ' , theTable , ' DROP FOREIGN KEY  ' , theConstraintName);
   PREPARE stmt FROM @s;
   EXECUTE stmt;
 END IF;
END $$


DELIMITER ;
