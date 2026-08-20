#!/bin/bash

echo ""
echo "====================================================="
echo "Running the end-to-end account tests using playwright"
echo "====================================================="
echo ""

# bash script mode
set -euo pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
	echo "Creating 'results' directory"
	mkdir results
fi

# # Kill the BHIMA server when the test is finished
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

echo "[test] Running end-to-end account tests using playwright."
cd ..
E2E_DIR=account npx playwright test 2>&1 | tee ./results/end-to-end-account-report

# Adjust formatting for Jenkins
sed -i 's/.spec.js//g' "./results/end-to-end-account-results.xml"

# FYI: Use --workers=1  to limit number of workers

# Clean up any left-over zombie node processes (if not CI)
set -o nounset
if [[ -z "${CI:-}" ]]; then
	procs=$(netstat -tulpn |& grep 8080) || true
	proc=$(echo $procs | sed -r 's/.* ([0-9]+)\/node$/\1/g')

	if [[ ! -z "$proc" ]]; then
		echo "Deleting zombie node Bhima process $proc"
		kill -9 $proc || true
	fi
fi

echo "[/test]"
