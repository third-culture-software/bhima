#!/bin/bash

# bash strict mode
set -euo pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
	echo "Creating 'results' directory"
	mkdir results
fi

./sh/build-database.sh || {
	echo 'failed to build DB'
	exit 1
}

echo "[test]"

echo "[test] building the server..."
# build the server
./node_modules/.bin/gulp build

echo "[test] running tests using mocha"
# run the tests
SUITE_NAME="BHIMA Integration Tests" MOCHA_OUTPUT="results/integration-report.xml" ./node_modules/.bin/mocha test/integration --timeout 20000 \
	--reporter mocha-multi-reporters --reporter-options configFile="mocha-reporter-options.js" 2>&1 | tee ./results/integration-report

echo "[/test]"
