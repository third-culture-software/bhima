DELIMITER $$

-- Patient Triggers

CREATE TRIGGER patient_reference BEFORE INSERT ON patient
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(patient.reference) + 1, 1) FROM patient WHERE patient.project_id = NEW.project_id);$$

CREATE TRIGGER patient_uuid_map AFTER INSERT ON patient
FOR EACH ROW BEGIN
  -- Write both the debtor and patient to the uuid_map table. 

  -- debtor entity reference removed to allow for reverse lookups - if debit
  -- entity is refined this can point directly to the debtor

  CALL UpdateUuidMap(NEW.uuid, NEW.project_id, 'PA', NEW.reference, NEW.display_name, 'entity');
  CALL UpdateUuidMap(NEW.debtor_uuid, NEW.project_id, 'PA', NEW.reference, NEW.display_name, 'entity');
END$$

-- Purchase Triggers

CREATE TRIGGER purchase_reference BEFORE INSERT ON purchase
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(purchase.reference) + 1, 1) FROM purchase WHERE purchase.project_id = NEW.project_id);$$

CREATE TRIGGER purchase_uuid_map AFTER INSERT ON purchase
FOR EACH ROW BEGIN
  CALL UpdateUuidMap(NEW.uuid, NEW.project_id, 'PO', NEW.reference, NEW.note, 'document');
END$$

-- Invoice Triggers

CREATE TRIGGER invoice_reference BEFORE INSERT ON invoice
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(invoice.reference) + 1, 1) FROM invoice WHERE invoice.project_id = NEW.project_id);$$

CREATE TRIGGER invoice_uuid_map AFTER INSERT ON invoice
FOR EACH ROW
BEGIN
    CALL UpdateUuidMap( NEW.uuid, NEW.project_id, 'IV', NEW.reference, NEW.description, 'document');
END$$


-- Cash Payment Triggers

CREATE TRIGGER cash_before_insert BEFORE INSERT ON cash
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(cash.reference) + 1, 1) FROM cash WHERE cash.project_id = NEW.project_id);$$

CREATE TRIGGER cash_uuid_map AFTER INSERT ON cash
FOR EACH ROW
BEGIN
    CALL UpdateUuidMap(NEW.uuid, NEW.project_id, 'CP', NEW.reference, NEW.description, 'document');
END$$

-- Voucher Triggers

CREATE TRIGGER voucher_before_insert BEFORE INSERT ON voucher
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(voucher.reference) + 1, 1) FROM voucher WHERE voucher.project_id = NEW.project_id);$$

CREATE TRIGGER voucher_uuid_map AFTER INSERT ON voucher
FOR EACH ROW BEGIN
  CALL UpdateUuidMap(NEW.uuid, NEW.project_id, 'VO', NEW.reference, NEW.description, 'document');
END$$


-- Employee Triggers

CREATE TRIGGER employee_before_insert BEFORE INSERT ON employee
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(employee.reference) + 1, 1) FROM employee);$$

-- Must be fixed if the system is to manage multiple Enterprises at the same time, which would add the Enterprise identifier to each employee : @lomamech
CREATE TRIGGER employee_uuid_map AFTER INSERT ON employee
FOR EACH ROW BEGIN
  INSERT INTO uuid_map
    SELECT NEW.creditor_uuid, CONCAT_WS('.', 'EM', enterprise.abbr, NEW.reference), patient.display_name, 'entity'
      FROM patient 
        JOIN project ON patient.project_id = project.id 
        JOIN enterprise ON project.enterprise_id = enterprise.id 
       WHERE patient.uuid = NEW.patient_uuid
    ON DUPLICATE KEY UPDATE short_name = CONCAT_WS('.', 'EM', enterprise.abbr, NEW.reference), long_name = patient.display_name;
END$$

-- Supplier Triggers

CREATE TRIGGER supplier_before_insert BEFORE INSERT ON supplier
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(supplier.reference) + 1, 1) FROM supplier);$$

CREATE TRIGGER supplier_uuid_map AFTER INSERT ON supplier
FOR EACH ROW BEGIN

  -- this writes the supplier's creditor into the uuid_map, pointing to the supplier
  INSERT INTO uuid_map
    SELECT NEW.creditor_uuid, CONCAT_WS('.', 'FO', NEW.reference), NEW.note, 'entity'
    ON DUPLICATE KEY UPDATE short_name = CONCAT_WS('.', 'FO', NEW.reference), long_name = NEW.note;
END$$

-- Stock Movement Triggers

-- the stock_movement reference is incremented based on the document_uuid.
CREATE TRIGGER stock_movement_reference BEFORE INSERT ON stock_movement
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(sm.reference) + 1, 1) FROM stock_movement sm WHERE sm.document_uuid <> NEW.document_uuid);$$

-- compute the document map by simply concatenating the flux_id and the reference
CREATE TRIGGER stock_movement_uuid_map AFTER INSERT ON stock_movement FOR EACH ROW
BEGIN
    -- Refactored from VALUES to SELECT to fix the broken syntax and maintain consistency
    INSERT INTO uuid_map
    SELECT NEW.document_uuid, CONCAT_WS('.', 'SM', NEW.flux_id, NEW.reference), NEW.description, 'document'
    ON DUPLICATE KEY UPDATE short_name = CONCAT_WS('.', 'SM', NEW.flux_id, NEW.reference), long_name = NEW.description;
END $$


-- Shipment Triggers
-- the shipment reference is incremented based on the shipment uuid.
CREATE TRIGGER shipment_reference BEFORE INSERT ON shipment
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(sh.reference) + 1, 1) FROM shipment sh WHERE sh.uuid <> NEW.uuid);$$

-- compute the document map
CREATE TRIGGER shipment_uuid_map AFTER INSERT ON shipment
FOR EACH ROW BEGIN
  CALL UpdateUuidMap(NEW.uuid, NEW.project_id, 'SHIP', NEW.reference, NEW.description, 'document');
END$$

-- Stock Requisition Triggers
CREATE TRIGGER stock_requisition_reference BEFORE INSERT ON stock_requisition
FOR EACH ROW
  SET NEW.reference = (SELECT COALESCE(NULLIF(NEW.reference, 0), MAX(stock_requisition.reference) + 1, 1) FROM stock_requisition  WHERE stock_requisition.project_id = NEW.project_id);$$

CREATE TRIGGER stock_requisition_uuid_map AFTER INSERT ON stock_requisition
FOR EACH ROW BEGIN
  CALL UpdateUuidMap(NEW.uuid, NEW.project_id, 'SREQ', NEW.reference, NEW.description, 'document');
END$$

DELIMITER ;
