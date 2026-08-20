#!/bin/bash

# bash strict mode
set -euo pipefail

set -a
source .env || { echo '[install-tests.sh] could not load .env, using variables from environment.'; }
set +a

./sh/build-init-database.sh || {
	echo 'failed to build DB'
	exit 1
}

echo "[install test]"

echo "[install test] building the server..."
# build and start the server
./node_modules/.bin/gulp build

echo "[install test] running tests using mocha"

# run the tests
./node_modules/.bin/mocha --recursive --bail --exit ./test/integration-install

echo "[/install test]"
