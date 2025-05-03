#!/bin/bash

echo ""
echo "==============================================="
echo "Running the end-to-end test $TEST_NUM using playwright"
echo "==============================================="
echo ""

# bash script mode
set +e
set -o pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
  echo "Creating 'results' directory"
  mkdir results
fi

# Delete any zombie server processes
procs=$(netstat -tulpn 2>&1 | grep 8080) || true
proc=$(echo $procs | sed -r 's/.* ([0-9]+)\/node$/\1/g')
if [[ ! -z "$proc" ]]; then
  echo "Deleting zombie node Bhima process $proc"
  kill -9 $proc || true
fi

# Kill the BHIMA server when the test is finished
if [[ -z "${CI:-}" ]]; then
  trap 'jobs -p | xargs -r kill' EXIT
fi

echo "Building Test Databases"

./sh/build-database.sh || {
  echo 'failed to build DB'
  exit 1
}

echo "[test]"

# set build timeout
TIMEOUT=${BUILD_TIMEOUT:-5}

echo "[test] Spawning BHIMA server process..."

# build and start the server
./node_modules/.bin/gulp build
cd bin
node server/app.js &

echo "[test] Spawned node process."

echo "[test] Sleeping for $TIMEOUT seconds."
sleep "$TIMEOUT"

echo "[test] Running end-to-end tests using playwright."
cd ..

npx playwright test $TESTS 2>&1 | tee "./results/end-to-end-report-$TEST_NUM"

# Adjust formatting for Jenkins
sed -i 's/.spec.js//g' "./results/end-to-end-$TEST_NUM-results.xml"

# FYI: Use PWTEST_SKIP_TEST_OUTPUT=1 to skip interactive web debug at the end
# FYI: Use --workers=1  to limit number of workers

echo "[/test]"
