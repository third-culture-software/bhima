DELIMITER $$

/* src: http://www.bluegecko.com/debugging-stored-procedures/ */


CREATE PROCEDURE SetupDebugLog()
BEGIN
   DECLARE debuglog_exists INT DEFAULT 0;

  /*
    check if debuglog is existing. This check seems redundant, but
    simply relying on 'create table if not exists' is not enough because
    a warning is thrown which will be caught by your exception handler
  */
  SELECT count(*) INTO debuglog_exists
  FROM information_schema.tables
  WHERE table_schema = database() AND table_name = 'debuglog';

  IF debuglog_exists = 0 THEN
    CREATE TABLE IF NOT EXISTS debuglog(
      entrytime DATETIME,
      connection_id INT NOT NULL DEFAULT 0,
      msg VARCHAR(512)
    );
  END IF;
  /*
    temp table is not checked in information_schema because it is a temp
    table
  */
  CREATE TEMPORARY TABLE IF NOT EXISTS tmp_debuglog(
       entrytime TIMESTAMP,
       connection_id INT NOT NULL DEFAULT 0,
       msg VARCHAR(512)
  ) ENGINE = MEMORY;
END $$


CREATE PROCEDURE DebugLog(in logMsg VARCHAR(512))
BEGIN
     DECLARE CONTINUE HANDLER FOR 1146 -- Table not found
     BEGIN
           call SetupDebugLog();

           INSERT INTO tmp_debuglog (connection_id, msg)
               VALUES (connection_id(), '[RESET]');
           INSERT INTO tmp_debuglog (connection_id, msg)
                VALUES (connection_id(), logMsg);
     END;

      INSERT INTO tmp_debuglog (connection_id, msg) VALUES (connection_id(), logMsg);
END $$

CREATE PROCEDURE FlushLog(in logMsg VARCHAR(512))
BEGIN
      CALL DebugLog(CONCAT("[FLUSH] ",IFNULL(logMsg, '')));
      INSERT INTO debuglog SELECT * FROM tmp_debuglog;
      DROP TABLE tmp_debuglog;
END $$

DELIMITER ;
