/* migration next */ 

TRUNCATE stock_value;
ALTER TABLE stock_value ADD UNIQUE KEY unique_inventory_uuid (inventory_uuid);
CALL zRecomputeInventoryStockValues();
