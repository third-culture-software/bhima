#!/bin/bash

set -euo pipefail

mkdir -p results

echo "[test] Building test databases..."
./sh/build-database.sh || {
  echo "[test] failed to build DB"
  exit 1
}

echo "[test]"

echo "[test] Building the server..."
./node_modules/.bin/gulp build

echo "[test] Running server unit tests using the native node:test runner..."
node --env-file-if-exists=.env --test --test-concurrency=1 "test/server-unit/**/*.test.js"

echo "[/test]"
