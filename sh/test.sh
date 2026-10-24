#!/bin/bash

set -euo pipefail

SUITE="${SUITE:-ALL}"
RESULTS_DIR="results"

print_header() {
  echo
  echo "----------------------------------------------------------------------"
  echo "$1"
  echo
}

# True if the requested suite is this one, or if all suites were requested
should_run() {
  [[ "$SUITE" == "ALL" || "$SUITE" == "$1" ]]
}

case "$SUITE" in
ALL | client-unit | server-unit | integration | integration-stock) ;;
*)
  echo "[$(basename "$0")] unknown SUITE '$SUITE'" >&2
  echo "Valid values: ALL, client-unit, server-unit, integration, integration-stock" >&2
  exit 1
  ;;
esac

mkdir -p "$RESULTS_DIR"

# Load DB settings from .env, falling back to the environment
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
else
  echo "[$(basename "$0")] could not find .env, using variables from environment."
fi

echo "Using database settings:
  DB_HOST: ${DB_HOST:-}
  DB_PORT: ${DB_PORT:-}
  DB_USER: ${DB_USER:-}
  DB_NAME: ${DB_NAME:-}
"

if should_run client-unit; then
  print_header "Running Client Unit Tests..."
  KARMA_FILENAME="client-unit-report.xml" \
    ./node_modules/.bin/karma start karma.conf.js --single-run --no-auto-watch 2>&1 |
    tee "$RESULTS_DIR/client-unit-report"
fi

if should_run server-unit; then
  print_header "Running Server Unit Tests..."
  ./sh/server-unit-tests-node.sh
fi

if should_run integration; then
  print_header "Running Integration Tests..."
  ./sh/integration-tests.sh
fi

if should_run integration-stock; then
  print_header "Running Stock Integration Tests..."
  ./sh/integration-stock-tests.sh
fi

./sh/test-show-results.sh
