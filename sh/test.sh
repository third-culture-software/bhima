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
  proc=$(echo $procs | sed -r 's/.* ([0-9]+)\/node$/\1/g')
  if [[ ! -z "$proc" ]]; then
    echo "Deleting zombie node Bhima process $proc"
    kill -9 $proc || true
  fi
}

reap_zombies

# get DB settings
set -a
source .env || { echo '[test.sh] did not load .env, using variables from environment.'; }
set +a

function startfold {
  echo
  echo "----------------------------------------------------------------------"
  echo $1
  echo
}

SUITE=${SUITE:-"ALL"}

# run karma (client unit) tests
if [ $SUITE = "client-unit" ] || [ $SUITE = "ALL" ]; then
  startfold "Running Client Unit Tests..." "test-client-unit"
  KARMA_FILENAME="client-unit-report.xml" ./node_modules/.bin/karma start karma.conf.js --single-run --no-auto-watch 2>&1 | tee ./results/client-unit-report
fi

# run server-unit test
if [ $SUITE = "server-unit" ] || [ $SUITE = "ALL" ]; then
  startfold "Running server Unit Tests ......" "server-unit"
  ./sh/server-unit-tests.sh
fi

# run integration tests
if [ $SUITE = "integration" ] || [ $SUITE = "ALL" ]; then
  startfold "Running Integration Tests..." "test-integration"
  ./sh/integration-tests.sh
fi

if [ $SUITE = "integration-stock" ] || [ $SUITE = "ALL" ]; then
  startfold "Running Stock Integration Tests..." "test-stock-integration"
  ./sh/integration-stock-tests.sh
fi

# Show summary of results
./sh/test-show-results.sh

reap_zombies

exit 0
