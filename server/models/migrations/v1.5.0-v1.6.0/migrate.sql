/*
 * DATABASE CHANGES FOR VERSION 1.5.0 TO 1.6.0 
 */

/*
 * @author: mbayopanda
 * @date: 2019-10-03
 */
DELETE FROM `cron` WHERE `label` = 'CRON.EACH_MINUTE';
INSERT INTO unit VALUES
(250, 'Sytem usage statistic', 'REPORT.SYSTEM_USAGE_STAT.TITLE', 'Sytem usage statistic', 144, '/modules/reports/systemUsageStat', '/reports/systemUsageStat');


INSERT INTO `report` (`report_key`, `title_key`) VALUES
('systemUsageStat', 'REPORT.SYSTEM_USAGE_STAT.TITLE');

/*
 * @author : jeremie Lodi
 * payroll using indexes
 * @date 2019-10-07
*/

DROP TABLE IF EXISTS `staffing_indice`;

CREATE TABLE `staffing_indice` (
  `uuid` BINARY(16) NOT NULL,
  `employee_uuid` BINARY(16) NOT NULL,
  `grade_uuid` BINARY(16) NOT NULL,
  `fonction_id`   TINYINT(3) UNSIGNED DEFAULT NULL,
  `grade_indice` DECIMAL(19,4) NOT NULL,
  `function_indice` DECIMAL(19,4) NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`uuid`),
  FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
  FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
  FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `staffing_grade_indice`;
CREATE TABLE `staffing_grade_indice` (
  `uuid` BINARY(16) NOT NULL,
  `value`  DECIMAL(19,4) NOT NULL,
  `grade_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `grade_uuid_uniq`(`grade_uuid`),
  FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `staffing_function_indice`;
CREATE TABLE `staffing_function_indice` (
  `uuid` BINARY(16) NOT NULL,
  `value`  DECIMAL(19,4) NOT NULL,
  `fonction_id`   TINYINT(3) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `fonction_id_uniq`(`fonction_id`),
  FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`)
) ENGINE=InnoDB;


ALTER TABLE  `rubric_payroll` ADD COLUMN `is_monetary_value`  TINYINT(1) DEFAULT 1;
ALTER TABLE  `rubric_payroll` ADD COLUMN `position`  TINYINT(1) DEFAULT 0;
ALTER TABLE  `rubric_payroll` ADD COLUMN `is_indice` TINYINT(1) DEFAULT 0;
ALTER TABLE  `rubric_payroll` ADD COLUMN  `indice_type` VARCHAR(50) DEFAULT NULL;
ALTER TABLE  `rubric_payroll` ADD COLUMN  `indice_to_grap` TINYINT(1) DEFAULT 0;

ALTER TABLE  `enterprise_setting` ADD COLUMN `enable_index_payment_system` TINYINT(1) NOT NULL DEFAULT 0;

DROP TABLE IF EXISTS `stage_payment_indice`;
CREATE TABLE `stage_payment_indice` (
  `uuid` BINARY(16) NOT NULL,
  `employee_uuid` BINARY(16) NOT NULL,
  `payroll_configuration_id` INT(10) UNSIGNED NOT NULL,
  `currency_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  `rubric_id` INT(10)  UNSIGNED NOT NULL,
  `rubric_value`  DECIMAL(19,4) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `paiement_1` (`employee_uuid`, `rubric_id`, `payroll_configuration_id`),
  KEY `employee_uuid` (`employee_uuid`),
  KEY `payroll_configuration_id` (`payroll_configuration_id`),
  KEY `currency_id` (`currency_id`),
  FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
  FOREIGN KEY (`rubric_id`) REFERENCES `rubric_payroll` (`id`),
  FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`),
  FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `staffing_indice_parameters`;
CREATE TABLE `staffing_indice_parameters` (
  `uuid` BINARY(16) NOT NULL,
  `pay_envelope`  DECIMAL(19,4) NOT NULL,
  `working_days`   TINYINT(3) UNSIGNED NOT NULL,
  `payroll_configuration_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `payroll_config_id`(`payroll_configuration_id`),
  FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`)
) ENGINE=InnoDB;

-- units
INSERT INTO unit VALUES
(251, 'indexes', 'TREE.INDEXES','The payrall-index', 57,'/modules/finance/','/PAYROLL_INDEX_FOLDER'),
(252, 'Staffing indexes management','TREE.STAFFING_INDICES_MANAGEMENT','Staffing indices management',251 ,'/modules/payroll/staffing_indice','/staffing_indices'),
(253, 'Multiple Payroll by indice','TREE.MULTI_PAYROLL_INDICE','Multiple Payroll (indice)', 251,'/modules/multiple_payroll_indice','/multiple_payroll_indice');


DELIMITER $$

DROP PROCEDURE IF EXISTS `UpdateStaffingIndices`$$
CREATE   PROCEDURE `UpdateStaffingIndices`(IN _dateFrom DATE, IN _dateTo DATE)
BEGIN
	DECLARE _id mediumint(8) unsigned;
	DECLARE _date_embauche DATE;
	DECLARE _employee_uuid, _grade_uuid, _current_staffing_indice_uuid, _last_staffing_indice_uuid BINARY(16);
	DECLARE _hiring_year, _fonction_id INT;
	DECLARE _grade_indice, _last_grade_indice, _function_indice DECIMAL(19,4);

	DECLARE done BOOLEAN;
	DECLARE curs1 CURSOR FOR 
	SELECT uuid, grade_uuid, fonction_id, date_embauche
		FROM employee;

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

	OPEN curs1;
		read_loop: LOOP
		FETCH curs1 INTO _employee_uuid, _grade_uuid, _fonction_id, _date_embauche;
			IF done THEN
				LEAVE read_loop;
			END IF;
			-- anciennette
			SET _hiring_year = FLOOR(DATEDIFF(_dateTo, _date_embauche)/365);
			-- is there any staffing indice specified for the employee in this payroll config period interval ?
			-- _current_staffing_indice_uuid is the indice for this payroll config period interval
			SET _current_staffing_indice_uuid  = IFNULL((
				SELECT st.uuid
				FROM staffing_indice st
				WHERE st.employee_uuid = _employee_uuid AND (st.date BETWEEN _dateFrom AND _dateTo)
				LIMIT 1
			), HUID('0'));

			SET _last_staffing_indice_uuid  = IFNULL((
				SELECT st.uuid
				FROM staffing_indice st
				WHERE st.employee_uuid = _employee_uuid
				ORDER BY st.created_at DESC
				LIMIT 1
			), HUID('0'));

			SET @grade_indice_rate = 0.05;
			SET @shouldInsert = FALSE;
			
			-- check if the date_embauche is in the current payroll config period interval
			SET @hiring_date = DATE(CONCAT(YEAR(_dateTo), '-', MONTH(_date_embauche), '-', DAY(_date_embauche)));
			SET @date_embauche_interval = (@hiring_date BETWEEN _dateFrom AND _dateTo);
			
			-- should update staffing_indice and there's no previous staffing_indice for in this payroll config period interval
			IF  ((@date_embauche_interval=1)  AND (_current_staffing_indice_uuid = HUID('0'))) THEN
				-- increase the _last_grade_indice if it exist
				IF (_last_staffing_indice_uuid <> HUID('0')) THEN
					SET _last_grade_indice = (SELECT grade_indice FROM staffing_indice WHERE uuid = _last_staffing_indice_uuid);
					SET _grade_indice =  _last_grade_indice + (_last_grade_indice*@grade_indice_rate);
				ELSE
					SET _grade_indice = (SELECT IFNULL(value, 0)  FROM staffing_grade_indice WHERE grade_uuid = _grade_uuid LIMIT 1);
					SET _grade_indice = _grade_indice + (_grade_indice*_hiring_year*@grade_indice_rate);
				END IF;
				SET @shouldInsert = TRUE;
			
			-- no indice has been created for the employee previously(no record in the table for him)
			-- this is used when configuring for the first time
			ELSE
			 	IF ((@date_embauche_interval = 0) && (_last_staffing_indice_uuid = HUID('0'))) THEN
					SET _grade_indice = (SELECT IFNULL(value, 0)  FROM staffing_grade_indice WHERE grade_uuid = _grade_uuid LIMIT 1);
					SET _grade_indice = _grade_indice + (_grade_indice * _hiring_year * @grade_indice_rate);
					SET @shouldInsert = TRUE;
				END IF;
			END IF;

			IF @shouldInsert THEN
				SET _function_indice = (SELECT IFNULL(value, 0) FROM staffing_function_indice WHERE fonction_id = _fonction_id LIMIT 1);			
				INSERT INTO staffing_indice(uuid, employee_uuid, grade_uuid, fonction_id, grade_indice, function_indice, date)
				VALUES(HUID(uuid()), _employee_uuid,  _grade_uuid , _fonction_id, IFNULL(_grade_indice, 0), IFNULL(_function_indice, 0), _dateTo);
			END IF;
		END LOOP;
	CLOSE curs1;
END$$


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
		WHERE  r.indice_type = _indice_type AND	 payroll_configuration_id = _payroll_configuration_id
  );

	RETURN IFNULL(totals, 1);
END$$

DROP FUNCTION IF EXISTS `getStagePaymentIndice`$$
CREATE  FUNCTION `getStagePaymentIndice`(_employee_uuid BINARY(16), 
_payroll_configuration_id INT, _indice_type VARCHAR(50) ) RETURNS DECIMAL(19, 4) DETERMINISTIC
BEGIN
	return IFNULL((SELECT SUM(rubric_value) as 'rubric_value'
		FROM stage_payment_indice sp
		JOIN rubric_payroll r ON r.id = sp.rubric_id
		WHERE sp.employee_uuid = _employee_uuid AND r.indice_type = _indice_type AND	
			payroll_configuration_id = _payroll_configuration_id
		LIMIT 1), 0);
END;


DROP PROCEDURE IF EXISTS `addStagePaymentIndice`$$
CREATE   PROCEDURE `addStagePaymentIndice`( 
	IN _employee_uuid BINARY(16),IN _payroll_configuration_id INT(10),

	IN _indice_type VARCHAR(50), IN _value DECIMAL(19, 10)
)
BEGIN
   DECLARE _rubric_id INT;
   DECLARE _stage_payment_uuid BINARY(16);

   SELECT id INTO _rubric_id FROM rubric_payroll WHERE indice_type = _indice_type LIMIT 1;
 	
   IF _rubric_id > 0 THEN 
	SET _stage_payment_uuid = IFNULL((
		SELECT sp.uuid 
		FROM stage_payment_indice sp
		JOIN rubric_payroll r ON r.id = sp.rubric_id
		WHERE sp.employee_uuid = _employee_uuid AND r.indice_type = _indice_type AND	
			payroll_configuration_id = _payroll_configuration_id
		LIMIT 1), HUID('0')
	);
   IF _stage_payment_uuid <> HUID('0') THEN
	DELETE FROM stage_payment_indice  WHERE uuid = _stage_payment_uuid;
   END IF;

   INSERT INTO stage_payment_indice
   	(uuid,employee_uuid, payroll_configuration_id, rubric_id, rubric_value ) VALUES
    (HUID(uuid()), _employee_uuid, _payroll_configuration_id, _rubric_id, _value);
  END IF;
END $$


DROP PROCEDURE IF EXISTS `updateIndices`$$
CREATE   PROCEDURE `updateIndices`( IN _payroll_configuration_id INT)
BEGIN

	DECLARE _employee_uuid BINARY(16);
	DECLARE _employee_grade_indice, _sumTotalCode,  _function_indice DECIMAL(19, 4);
	
	DECLARE done BOOLEAN;
	DECLARE curs1 CURSOR FOR 
	SELECT cei.employee_uuid 
	FROM payroll_configuration pc
	JOIN config_employee ce ON ce.id = pc.config_employee_id
	JOIN config_employee_item cei ON cei.config_employee_id = ce.id
	WHERE pc.id = _payroll_configuration_id;

  DECLARE curs2 CURSOR FOR 
	SELECT cei.employee_uuid 
	FROM payroll_configuration pc
	JOIN config_employee ce ON ce.id = pc.config_employee_id
	JOIN config_employee_item cei ON cei.config_employee_id = ce.id
	WHERE pc.id = _payroll_configuration_id;


	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	
	OPEN curs1;
		read_loop: LOOP
		FETCH curs1 INTO _employee_uuid;
			IF done THEN
				LEAVE read_loop;
			END IF;

			SELECT st.grade_indice, st.function_indice
			INTO _employee_grade_indice, _function_indice
			FROM staffing_indice st
			WHERE st.employee_uuid = _employee_uuid
			ORDER BY st.created_at DESC
			LIMIT 1;
						
			CALL addStagePaymentIndice( _employee_uuid,_payroll_configuration_id,'is_base_index', IFNULL(_employee_grade_indice, 0));
			
			SET @responsabilite = IFNULL(_function_indice, 0);
			CALL addStagePaymentIndice( _employee_uuid,_payroll_configuration_id,'is_responsability', @responsabilite);
									
			-- tot jrs
			SET @tot_jrs = getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_day_worked') +
				 getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_extra_day');

			CALL addStagePaymentIndice( _employee_uuid,_payroll_configuration_id,'is_total_days', IFNULL(@tot_jrs, 0));
			
			-- 
			SET @nbrJour = 0;
			SET @envelopPaie = 0;
			-- get pay_envelope from staffing_indice_parameters table
			SELECT IFNULL(pay_envelope, 0), IFNULL(working_days, 0) 
			INTO @envelopPaie, @nbrJour 
			FROM staffing_indice_parameters
			WHERE payroll_configuration_id = _payroll_configuration_id;
			

			SET @indiceBase = getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_base_index');
		    -- A revoir le calcul
			-- SET @indiceJour = maxBaseIndice(_payroll_configuration_id)/@nbrJour;
			SET @indiceJour = IFNULL(@indiceBase/@nbrJour, 0);
			
			CALL addStagePaymentIndice( _employee_uuid, _payroll_configuration_id,'is_day_index', @indiceJour);
			CALL addStagePaymentIndice( _employee_uuid, _payroll_configuration_id,'is_number_of_days', @nbrJour);
		
			-- indice reajust = @indiceJour*(tot jrs)
			SET @indice_reajust = IFNULL(@indiceJour*@tot_jrs, 0);
		
			CALL addStagePaymentIndice( _employee_uuid, _payroll_configuration_id,'is_reagistered_index', @indice_reajust);
			
			-- other profits
			SET @otherProfits = getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_other_profits');
	
  
			CALL addStagePaymentIndice( _employee_uuid, _payroll_configuration_id, 'is_total_code', 
				@indice_reajust  + @responsabilite  + @otherProfits
			);
			
		END LOOP;
	CLOSE curs1;

	-- pay_rate = @envelopPaie / (sum total code) // Masse de paie
	SET _sumTotalCode = sumTotalIndex(_payroll_configuration_id, 'is_total_code');
  SET done = FALSE;

  OPEN curs2;
		read_loop: LOOP
		FETCH curs2 INTO _employee_uuid;
			IF done THEN
				LEAVE read_loop;
			END IF;
  
			CALL addStagePaymentIndice( _employee_uuid,_payroll_configuration_id,'is_pay_rate', @envelopPaie/_sumTotalCode);
			-- sal de base
			SET @sal_de_base = getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_total_code')*
				getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_pay_rate');

			CALL addStagePaymentIndice( _employee_uuid,_payroll_configuration_id,'is_gross_salary', IFNULL(@sal_de_base, 0));

			UPDATE employee SET individual_salary = getStagePaymentIndice(_employee_uuid, _payroll_configuration_id, 'is_gross_salary')
			WHERE uuid = _employee_uuid;

  		END LOOP;
	CLOSE curs2;

END$$

DELIMITER ;
