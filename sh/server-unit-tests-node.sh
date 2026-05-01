#!/bin/bash

# bash strict mode
set -euo pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
  echo "Creating 'results' directory"
  mkdir results
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

echo "[test] building the server..."
# build the server
./node_modules/.bin/gulp build

echo "[test] running server unit tests using native node:test runner"

node --test test/server-unit/**/*.test.js

echo "[/test]"

