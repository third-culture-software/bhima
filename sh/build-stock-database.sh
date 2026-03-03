#!/bin/bash

# bash strict mode
set -o pipefail

# This assumes you run tests from the top level bhima directory.

echo "[build]"
echo "Building BHIMA Stock Database"

set -a
source .env || { echo '[build-database.sh] did not load .env, using variables from environment.'; }
set +a

# set build timeout
TIMEOUT=${BUILD_TIMEOUT:-8}

fout=/dev/null

if [ "$1" == "debug" ]; then
  fout=/dev/tty
fi

# default database port
DB_PORT=${DB_PORT:-3306}

echo "Building database: $DB_USER,$DB_PASS,$DB_HOST,$DB_PORT,$DB_NAME'"

# build the test database
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "DROP DATABASE IF EXISTS $DB_NAME ;" || {
  echo 'failed to drop DB'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
  echo 'failed to create DB'
  exit 1
}

echo "[build] database schema"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/01-schema.sql || {
  echo 'failed to build DB schema'
  exit 1
}

echo "[build] functions"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/02-functions.sql || {
  echo 'failed to import functions into DB'
  exit 1
}

echo "[build] procedures"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/03-procedures.sql || {
  echo 'failed to import procedures into DB 1/2'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/98-admin.sql || {
  echo 'failed to import procedures into DB 2/2'
  exit 1
}

echo "[build] triggers"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/04-triggers.sql || {
  echo 'failed to import triggers into DB'
  exit 1
}

echo "[build] default data"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/05-icd10.sql || {
  echo 'failed to import default data into DB 1/2'
  exit 1
}

mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/06-bhima.sql || {
  echo 'failed to import default data into DB 2/2'
  exit 1
}

echo "[build] stock test data"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <test/data/enterprise.sql || {
  echo 'failed to import test data into DB 1/5'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <test/data/accounts.sql || {
  echo 'failed to import test data into DB 2/5'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <test/data/inventories.sql || {
  echo 'failed to import test data into DB 3/5'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <test/data/core.sql || {
  echo 'failed to import test data into DB 4/5'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <test/data/service-stock.sql || {
  echo 'failed to import test data into DB 5/5'
  exit 1
}

echo "[build] recomputing mappings"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -e "Call zRecomputeEntityMap();" || {
  echo 'failed to recompute mappings 1/2'
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -e "Call zRecomputeDocumentMap();" || {
  echo 'failed to recompute mappings 2/2'
  exit 1
}

echo "[build] recalculating period totals"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -e "Call zRecalculatePeriodTotals();" || {
  echo 'failed to recalculate period totals'
  exit 1
}

echo "[build] recalulcating stock_movement_status"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -e "CALL zRecomputeStockMovementStatus();" || {
  echo 'failed to recalculate stock movement status'
  exit 1
}

echo "[build] recalulcating stock_value"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -e "CALL RecomputeStockValue(NULL);" || {
  echo 'failed to recalculate stock value'
  exit 1
}

echo "[/build]"
