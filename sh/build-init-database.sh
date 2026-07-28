#!/usr/bin/env bash

# bash strict mode
set -o pipefail

# This script is for building the initial database of bhima application
# this database is supposed to be the starting point of any bhima installation

echo "[ build ] Building BHIMA Database"

set -a
source .env || { echo "[build-init-database.sh] could not load .env, using variables from environment."; }
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

# build the initial database
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "DROP DATABASE IF EXISTS $DB_NAME ;" || {
  echo "failed to drop DB"
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
  echo "failed to create DB"
  exit 1
}

echo "[ build ] database schema"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/01-schema.sql || {
  echo "failed to build DB scheme"
  exit 1
}

echo "[ build ] functions"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/02-functions.sql || {
  echo "failed to import functions into DB"
  exit 1
}

echo "[ build ] procedures"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/03-procedures.sql
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/98-admin.sql || {
  echo "failed to import procedures into DB 2/2"
  exit 1
}

echo "[ build ] triggers"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/04-triggers.sql

echo "[ build ] default data"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/05-icd10.sql || {
  echo "failed to import default data into DB 1/2"
  exit 1
}
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" <server/models/06-bhima.sql || {
  echo "failed to import default data into DB 2/2"
  exit 1
}

echo "[build] recomputing mappings"
mysql -u "$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -e "Call zRecomputeUuidMapping();" || {
  echo "failed to recompute UUID mappings"
  exit 1
}

echo "[ /build ]"
