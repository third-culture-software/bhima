#!/bin/bash

set -euo pipefail

RESULTS_DIR="results"

# Load DB settings from .env, falling back to the environment
set -a
source .env || echo "[test.sh] did not load .env, using variables from environment."
set +a

print_header() {
  echo
  echo "----------------------------------------------------------------------"
  echo "$1"
  echo
}

mkdir -p "$RESULTS_DIR"

# Run every suite even if one fails, so the summary covers all of them
failed=0
for i in {1..8}; do
  date
  print_header "Running account End to End Tests $i ..."
  npm run "test:e2e-$i" || failed=1
done
date

./sh/test-show-results.sh

exit "$failed"
