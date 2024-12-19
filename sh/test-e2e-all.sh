#!/bin/bash

# bash strict mode
set +e
set -o pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
  echo "Creating 'results' directory"
  mkdir results
fi

# get DB settings
set -a
source .env || { echo '[test.sh] did not load .env, using variables from environment.'; }
set +a

function makedots {
  echo
  echo "----------------------------------------------------------------------"
  echo $1
  echo
}

SUITE=${SUITE:-"ALL"}

# run end to end account tests with Playwright
for i in {1..8}; do
  date
  makedots "Running account End to End Tests $i ..."
  npm run test:e2e-$i
  # endfold "test-end-to-end-$i" ;
done
date

# Delete left-over zombie server process
procs=$(netstat -tulpn |& grep 8080) || true
proc=$(echo $procs | sed -r 's/.* ([0-9]+)\/node$/\1/g')
if [[ ! -z "$proc" ]]; then
  echo "Deleting zombie node Bhima process $proc"
  kill -9 $proc || true
fi

# Show summary of results
./sh/test-show-results.sh

exit 0
