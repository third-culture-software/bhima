#!/bin/bash

set -euo pipefail

: "${TEST_NUM:?TEST_NUM must be set}"

RESULTS_DIR="results"
REPORT="$RESULTS_DIR/end-to-end-report-$TEST_NUM"
JUNIT_XML="$RESULTS_DIR/end-to-end-$TEST_NUM-results.xml"

echo
echo "==============================================="
echo "Running the end-to-end test $TEST_NUM using playwright"
echo "==============================================="
echo

mkdir -p "$RESULTS_DIR"

echo "[test]"

echo "[test] Building test databases..."
./sh/build-database.sh || {
  echo "[test] failed to build DB"
  exit 1
}

# Playwright starts the BHIMA server itself via its webServer config,
# so this step only needs to build the client and server code.
echo "[test] Building BHIMA..."
./node_modules/.bin/gulp build

# Tips:
#   PWTEST_SKIP_TEST_OUTPUT=1  skips the interactive web debug report at the end
#   --workers=1                limits the number of parallel workers
echo "[test] Running end-to-end tests using playwright."

# Capture the result instead of exiting, so the report is still post-processed.
# $TESTS is intentionally unquoted so it can expand to multiple arguments.
status=0
npx playwright test ${TESTS:-} 2>&1 | tee "$REPORT" || status=$?

# Strip ".spec.js" from test names for Jenkins
if [[ -f "$JUNIT_XML" ]]; then
  sed -i 's/\.spec\.js//g' "$JUNIT_XML"
fi

echo "[/test]"

exit "$status"
