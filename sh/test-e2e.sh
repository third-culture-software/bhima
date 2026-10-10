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

echo "Building Test Databases"

./sh/build-database.sh || {
  echo 'failed to build DB'
  exit 1
}

echo "[test]"

echo "[test] Spawning BHIMA server process..."

# build and start the server using webServer
./node_modules/.bin/gulp build

echo "[test] Running end-to-end tests using playwright."

npx playwright test $TESTS 2>&1 | tee "./results/end-to-end-report-$TEST_NUM"

# Adjust formatting for Jenkins
sed -i 's/.spec.js//g' "./results/end-to-end-$TEST_NUM-results.xml"

# FYI: Use PWTEST_SKIP_TEST_OUTPUT=1 to skip interactive web debug at the end
# FYI: Use --workers=1  to limit number of workers

echo "[/test]"
