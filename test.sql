
SET @date = DATE(NOW());
SET @start_date = DATE_SUB(@date, INTERVAL 6 MONTH);
SET @depot_uuid = HUID('F9CAEB16168443C5A6C447DBAC1DF296');
SET @inventory_uuid = HUID('43F3DECBFCE9426E940ABC2150E62186');

  SELECT
    SUM(IF(sms.sum_quantity <= 0, sms.duration, 0)) as x,
    SUM(IF(sms.sum_quantity > 0, sms.duration, 0)) AS y,
    SUM(IF(sms.out_quantity_consumption != 0, 1, 0)) AS z,
    MIN(sms.date) as md,
    MAX(sms.date) as mxd,

    -- NOTE(@jniles): sum_* fields are monotonically increasing, so the MAX is the last,
    -- MIN is the first
    SUM(sms.out_quantity_consumption),
    SUM(sms.out_quantity_exit)

    /*
  INTO
    _sum_stock_out_day,
    _sum_stock_day,
    _sum_consumption_day,
    _min_date,
    _max_date,
    _sum_consumed_quantity,
    _sum_exit_quantity
    */
  FROM stock_movement_status AS sms WHERE
    sms.date >=@start_date AND
    sms.date <= @date AND
    sms.depot_uuid = @depot_uuid AND
    sms.inventory_uuid = @inventory_uuid;

SELECT sms.sum_out_quantity_exit, sum_out_quantity_consumption from stock_movement_status AS sms where
    sms.date >=@start_date AND
    sms.date <= @date AND
    sms.depot_uuid = @depot_uuid AND
    sms.inventory_uuid = @inventory_uuid;
