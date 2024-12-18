#!/usr/bin/env bash

# bash strict mode
set -uo pipefail
trap 'echo "Error: Command failed on line $LINENO"; exit 1' ERR

# log function
log() {
  local message="${1}"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [migrate] ${message}"
}

# This script creates a migration script to upgrade BHIMA from the previous version of BHIMA
# to the next version.  It will only pull in data from the next/*.sql folder, so it can only
# upgrade from the most recent version to the current version.

# NOTE: the file used to determined variables is the .env file.  Please make sure
# this file is up to date.

# TODO(@jniles) - look up current version, and pull in all versions until present version.

log "Migrating BHIMA database"

log "Reading settings from .env."

# Make sure that .env exists.
if [[ ! -f .env ]]; then
  log "[ERROR] .env file not found. Please create and configure the environment file."
  exit 1
fi

# Source environment variables with error checking
source .env || {
  log "[ERROR] Could not load .env file. Ensure it exists and is readable."
  exit 1
}

# Validate required environment variables
required_vars=("DB_NAME" "DB_USER" "DB_PASS")
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    log "[ERROR] Missing required environment variable: $var"
    exit 1
  fi
done

# Set up variables used for naming things
FILENAME="migration"
DATABASE="$DB_NAME"
MIGRATION_FILE="$FILENAME-$DATABASE.sql"

log "Using database \"$DATABASE\" defined in environment file."

# path to the BHIMA application.  Since we are in the context of the repository, it
# is just the directory above.
BHIMA_PATH="$(pwd)"

# make sure the database has the correct character sets and encodings
log "Setting up script with charsets and encodings..."
echo "SET names 'utf8mb4';
SET character_set_database = 'utf8mb4';
SET collation_database = 'utf8mb4_unicode_ci';
SET CHARACTER SET utf8mb4, CHARACTER_SET_CONNECTION = utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
" >$MIGRATION_FILE

log "Adding DROP TRIGGERS for $DATABASE."
mysql -u $DB_USER --password=$DB_PASS -e "SELECT CONCAT('DROP TRIGGER IF EXISTS ', trigger_name, ';') FROM information_schema.triggers WHERE trigger_schema = '$DATABASE';" |
  sed '1d' \
    >>$MIGRATION_FILE

echo "" >>$MIGRATION_FILE

log "Adding DROP ROUTINES for $DATABASE."
mysql -u $DB_USER --password=$DB_PASS -e "SELECT CONCAT('DROP ',ROUTINE_TYPE,' IF EXISTS ',ROUTINE_SCHEMA,'.',ROUTINE_NAME,';') as stmt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '$DATABASE';" |
  sed '1d' \
    >>$MIGRATION_FILE

echo "" >>$MIGRATION_FILE

log "Adding latest triggers, functions, and procedures to $DATABASE."
cat "$BHIMA_PATH"/server/models/02-functions.sql \
  "$BHIMA_PATH"/server/models/03-procedures.sql \
  "$BHIMA_PATH"/server/models/98-admin.sql \
  "$BHIMA_PATH"/server/models/04-triggers.sql \
  >>$MIGRATION_FILE

echo "" >>$MIGRATION_FILE

log "Finished creating script skeleton"
log "Adding manual migrations from next/migrate.sql"

cat "$BHIMA_PATH"/server/models/migrations/next/migrate.sql >>$MIGRATION_FILE

# Add migration files specific to this production server
for sitefile in "$BHIMA_PATH"/server/models/migrations/next/*"$DATABASE"*.sql; do
  [[ -f "$sitefile" ]] || continue
  log "Adding site-specific migration file: $sitefile"
  cat $sitefile >>$MIGRATION_FILE
done

log "Finished constructing migration script."
log "Execute \"mysql $DATABASE < $MIGRATION_FILE\" with appropriate permissions to migrate"
