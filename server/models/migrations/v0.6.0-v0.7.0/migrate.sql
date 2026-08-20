/*
This script will update the database to its current version.
*/

SET foreign_key_checks = 0;
ALTER TABLE inventory_group ADD COLUMN expires TINYINT(1) DEFAULT 1;
ALTER TABLE inventory_group ADD COLUMN unique_item TINYINT(1) DEFAULT 0;

ALTER TABLE account DROP COLUMN is_asset;
ALTER TABLE account DROP COLUMN is_brut_link;
ALTER TABLE account DROP COLUMN is_title;
ALTER TABLE account DROP COLUMN is_charge;

DROP TABLE config_rubric;
DROP TABLE config_rubric_item;
DROP TABLE config_tax;
DROP TABLE config_tax_item;

DROP TABLE cotisation;
DROP TABLE cotisation_payment;
DROP TABLE payment_period;

DROP TABLE rubric;
DROP TABLE rubric_paiement;

DROP TABLE tax;
DROP TABLE tax_paiement;

DROP TABLE config_cotisation_item;
DROP TABLE config_cotisation;

DROP TABLE IF EXISTS rubric_payroll;

CREATE TABLE rubric_payroll (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    label VARCHAR(80) NOT NULL,
    abbr VARCHAR(6) DEFAULT NULL,
    is_employee TINYINT(1) DEFAULT 0,
    is_percent TINYINT(1) DEFAULT 0,
    is_discount TINYINT(1) DEFAULT 0,
    is_tax TINYINT(1) DEFAULT 0,
    is_social_care TINYINT(1) DEFAULT 0,
    debtor_account_id INT(10) UNSIGNED DEFAULT NULL,
    expense_account_id INT(10) UNSIGNED DEFAULT NULL,
    is_ipr TINYINT(1) DEFAULT 0,
    value FLOAT DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY rubric_payroll_1 (label),
    KEY debtor_account_id (debtor_account_id),
    KEY expense_account_id (expense_account_id),
    FOREIGN KEY (debtor_account_id) REFERENCES account (id),
    FOREIGN KEY (expense_account_id) REFERENCES account (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- For some reason, MariaDB is being a pain with this.  Skipping it for now.
-- ALTER TABLE `offday` DROP CONSTRAINT `offday_1`;
-- ALTER TABLE `offday` ADD UNIQUE `offday_1` (`date`);
ALTER TABLE inventory ADD COLUMN note TEXT NULL;

ALTER TABLE patient ADD COLUMN health_zone VARCHAR(30);
ALTER TABLE patient ADD COLUMN health_area VARCHAR(30);

ALTER TABLE inventory ADD COLUMN last_purchase DATE NULL COMMENT 'This element allows to store the date of the last purchase order of the product in order to allow the calculation without making much of the average ordering interval';
ALTER TABLE inventory ADD COLUMN num_purchase INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of purchase orders';
ALTER TABLE inventory ADD COLUMN num_delivery INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of stock delivery';

ALTER TABLE inventory CHANGE COLUMN delay delay DECIMAL(10, 4) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Delivery time';
ALTER TABLE inventory CHANGE COLUMN avg_consumption avg_consumption DECIMAL(10, 4) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Average consumption';
ALTER TABLE inventory CHANGE COLUMN purchase_interval purchase_interval DECIMAL(10, 4) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Purchase Order interval';

DROP TABLE IF EXISTS taxe_ipr;
CREATE TABLE taxe_ipr (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    currency_id TINYINT(3) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY currency_id (currency_id),
    FOREIGN KEY (currency_id) REFERENCES currency (id) ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS taxe_ipr_configuration;
CREATE TABLE taxe_ipr_configuration (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    rate FLOAT NOT NULL,
    tranche_annuelle_debut FLOAT DEFAULT NULL,
    tranche_annuelle_fin FLOAT DEFAULT NULL,
    tranche_mensuelle_debut FLOAT DEFAULT NULL,
    tranche_mensuelle_fin FLOAT DEFAULT NULL,
    ecart_annuel FLOAT DEFAULT NULL,
    ecart_mensuel FLOAT DEFAULT NULL,
    impot_annuel FLOAT DEFAULT NULL,
    impot_mensuel FLOAT DEFAULT NULL,
    cumul_annuel FLOAT DEFAULT NULL,
    cumul_mensuel FLOAT DEFAULT NULL,
    taxe_ipr_id INT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY taxe_ipr_id (taxe_ipr_id),
    FOREIGN KEY (taxe_ipr_id) REFERENCES taxe_ipr (id) ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;


SET foreign_key_checks = 1;
