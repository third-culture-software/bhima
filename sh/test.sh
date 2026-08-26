#!/bin/bash

# bash strict mode
set -eo pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
  echo "Creating 'results' directory"
  mkdir results
fi

function reap_zombies() {
  # Delete any zombie server processes
  procs=$(netstat -tulpn 2>&1 | grep 8080) || true
  proc=$(echo "$procs" | sed -r 's/.* ([0-9]+)\/node$/\1/g')
  if [[ ! -z "$proc" ]]; then
    echo "Deleting zombie node Bhima process $proc"
    kill -9 "$proc" || true
  fi
}

reap_zombies

# get DB settings
source .env || echo "[$(basename "$0")] did not load .env, using variables from environment."
set +a

function startfold {
  echo
  echo "----------------------------------------------------------------------"
  echo "$1"
  echo
}

SUITE=${SUITE:-"ALL"}

echo "Using database settings:
  DB_HOST: $DB_HOST
  DB_PORT: $DB_PORT
  DB_USER: $DB_USER
  DB_NAME: $DB_NAME
"
# run karma (client unit) tests
if [ "$SUITE" = "client-unit" ] || [ "$SUITE" = "ALL" ]; then
  startfold "Running Client Unit Tests..."
  KARMA_FILENAME="client-unit-report.xml" ./node_modules/.bin/karma start karma.conf.js --single-run --no-auto-watch 2>&1 | tee ./results/client-unit-report
fi

# run server-unit test
if [ "$SUITE" = "server-unit" ] || [ "$SUITE" = "ALL" ]; then
  startfold "Running server unit tests (with native runner) ......"
  ./sh/server-unit-tests-node.sh
fi

# run integration tests
if [ "$SUITE" = "integration" ] || [ "$SUITE" = "ALL" ]; then
  startfold "Running Integration Tests..."
  ./sh/integration-tests.sh
fi

if [ "$SUITE" = "integration-stock" ] || [ "$SUITE" = "ALL" ]; then
  startfold "Running Stock Integration Tests..."
  ./sh/integration-stock-tests.sh
fi

# Show summary of results
./sh/test-show-results.sh

reap_zombies

exit 0
