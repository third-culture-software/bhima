/*
MIGRATION NOTES

A whole lot changed in the two months.  It is best to rebuild all stored
procedures to reflect this.
*/

ALTER TABLE posting_journal ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE posting_journal ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

/*
Roles were a major addition to the BHIMA ecosystem.  They allow the re-use of
the same permissions structure for multiple users.

This migration script sets up a role per user in the name of the user.  This
keeps the same behavior as the pre-role permissions and enables quick migration.
However, it can be revisited manually by the users.
*/

DROP TABLE IF EXISTS role;
CREATE TABLE role (
    uuid binary(16) NOT NULL,
    label varchar(50) NOT NULL,
    project_id smallint(5) unsigned NOT NULL,
    KEY project_id (project_id),
    PRIMARY KEY (uuid),
    UNIQUE project_role_label (project_id, label),
    FOREIGN KEY (project_id) REFERENCES project (id) ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS user_role;
CREATE TABLE user_role (
    uuid binary(16) NOT NULL,
    user_id smallint(5) unsigned NOT NULL,
    role_uuid binary(16) NOT NULL,
    PRIMARY KEY (uuid),
    UNIQUE role_for_user (user_id, role_uuid),
    FOREIGN KEY (role_uuid) REFERENCES role (uuid) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS role_unit;
CREATE TABLE role_unit (
    uuid binary(16) NOT NULL,
    role_uuid binary(16) NOT NULL,
    unit_id smallint(5) unsigned DEFAULT NULL,
    PRIMARY KEY (uuid),
    FOREIGN KEY (role_uuid) REFERENCES role (uuid) ON UPDATE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES unit (id) ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- create a role for each user/project combo
INSERT INTO role
SELECT
    HUID(UUID()),
    user.display_name,
    pp.project_id
FROM user INNER JOIN project_permission AS pp ON user.id = pp.user_id;

-- assign roles to users
INSERT INTO user_role
SELECT
    HUID(UUID()),
    user.id,
    role.uuid
FROM role INNER JOIN user ON role.label = user.display_name;

-- clean up old permissions
DELETE FROM permission
WHERE unit_id NOT IN (SELECT id FROM unit);

INSERT INTO role_unit
SELECT
    HUID(UUID()),
    role.uuid,
    permission.unit_id
FROM permission INNER JOIN user ON permission.user_id = user.id
INNER JOIN role ON user.display_name = role.label;

-- payroll tables
DROP TABLE IF EXISTS weekend_config;
CREATE TABLE weekend_config (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    label varchar(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY weekend_config (label)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS config_week_days;
CREATE TABLE config_week_days (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    indice int(10) unsigned NOT NULL,
    weekend_config_id int(10) unsigned NOT NULL,
    PRIMARY KEY (id),
    KEY weekend_config_id (weekend_config_id),
    FOREIGN KEY (weekend_config_id) REFERENCES weekend_config (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS payroll_configuration;
CREATE TABLE payroll_configuration (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    label varchar(100) NOT NULL,
    datefrom date NOT NULL,
    dateto date NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY payroll_configuration (label)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS config_accounting;
CREATE TABLE config_accounting (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    label varchar(100) NOT NULL,
    account_id int(10) unsigned NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY config_accounting_1 (label),
    UNIQUE KEY config_accounting_2 (label, account_id),
    KEY account_id (account_id),
    FOREIGN KEY (account_id) REFERENCES account (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

DROP TABLE IF EXISTS offday;
CREATE TABLE offday (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    label varchar(100) NOT NULL,
    date date NOT NULL,
    percent_pay float DEFAULT '100',
    PRIMARY KEY (id),
    UNIQUE KEY offday_1 (date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

/*
 Add Enterprise Settings
*/

DROP TABLE IF EXISTS enterprise_setting;
CREATE TABLE enterprise_setting (
    enterprise_id smallint(5) unsigned NOT NULL,
    enable_price_lock tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (enterprise_id),
    FOREIGN KEY (enterprise_id) REFERENCES enterprise (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

INSERT INTO enterprise_setting VALUES (1, 1);

/*
Update transaction type
*/
ALTER TABLE posting_journal CHANGE COLUMN origin_id transaction_type_id tinyint(3) unsigned NULL;
ALTER TABLE general_ledger CHANGE COLUMN origin_id transaction_type_id tinyint(3) unsigned NULL;

ALTER TABLE inventory_type CHANGE COLUMN text text varchar(30) NOT NULL;
ALTER TABLE village ADD COLUMN longitude decimal(19, 6) NULL;
ALTER TABLE village ADD COLUMN latitude decimal(19, 6) NULL;

ALTER TABLE depot ADD COLUMN location_uuid binary(16) NULL;

/*
More Role Stuff
*/
DROP TABLE IF EXISTS actions;
CREATE TABLE actions (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    description varchar(100) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE role_actions (
    uuid binary(16) NOT NULL,
    role_uuid binary(16) NOT NULL,
    actions_id int(10) unsigned NOT NULL,
    PRIMARY KEY (uuid),
    FOREIGN KEY (actions_id) REFERENCES actions (id) ON UPDATE CASCADE,
    FOREIGN KEY (role_uuid) REFERENCES role (uuid) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

ALTER TABLE flux ADD COLUMN description text;
ALTER TABLE inventory DROP COLUMN is_broken;
ALTER TABLE inventory ADD COLUMN sellable tinyint(1) NOT NULL DEFAULT 1;
