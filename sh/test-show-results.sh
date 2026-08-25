#!/bin/bash

set -euo pipefail

if [[ ! -d results ]]; then
  echo "There are no test results!"
  echo
  exit
fi

echo "TEST RESULTS SUMMARY"
echo
if test -f "./results/client-unit-report"; then
  sed -i -e 's/\x1b\[[0-9mAK;]*//g' ./results/client-unit-report # Remove ANSI move sequences that disrupts the display

  echo "Client Unit Tests"
  echo "    " "$(grep TOTAL ./results/client-unit-report | sed -e 's/TOTAL: //')"
  failed=$(grep -i "FAIL" ./results/client-unit-report)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi

if test -f "./results/integration-report"; then
  sed -i -e 's/\x1b\[[0-9mAK;]*//g' ./results/integration-report # Remove ANSI move sequences that disrupts the display
  echo "Integration Tests"
  echo "  " "$(grep 'passing' ./results/integration-report)"
  pending=$(grep -E 'pending' ./results/integration-report)
  if [ "$pending" ]; then echo "   $pending"; fi
  failed=$(grep -E 'failing' ./results/integration-report)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi

if test -f "./results/integration-stock-report"; then
  sed -i -e 's/\x1b\[[0-9mAK;]*//g' ./results/integration-stock-report # Remove ANSI move sequences that disrupts the display
  echo "Stock Integration Tests"
  echo "  " "$(grep 'passing' ./results/integration-stock-report)"
  pending=$(grep -E 'pending' ./results/integration-stock-report)
  if [ "$pending" ]; then echo "   $pending"; fi
  failed=$(grep -E 'failing' ./results/integration-stock-report)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi

# Show the E2E account tests, if available
if test -f "./results/end-to-end-report-account"; then
  sed -i -e 's/\x1b\[[0-9mAK;]*//g' "./results/end-to-end-report-account" # Remove ANSI move sequences that disrupts the display
  echo "End-to-end account tests (Playwright)"
  echo "  " "$(grep 'passed' ./results/end-to-end-report-account)"
  pending=$(grep -E '([0-9]+ pending)' ./results/end-to-end-report-account)
  if [ "$pending" ]; then echo "   $pending"; fi
  skipped=$(grep -E '([0-9]+ skipped)' ./results/end-to-end-report-account)
  if [ "$skipped" ]; then echo "   $skipped"; fi
  flaky=$(grep -E '([0-9]+ flakey|[0-9]+ flaky)' ./results/end-to-end-report-account)
  if [ "$flaky" ]; then echo "   $flaky"; fi
  failed=$(grep -E '([0-9]+ failing|[0-9]+ failed)' ./results/end-to-end-report-account)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi

for i in {1..8}; do
  REPORT_PATH="./results/end-to-end-report-$i"

  if [[ -f "$REPORT_PATH" ]]; then
    echo "================================================"
    echo "End-to-end tests $i (Playwright)"
    echo "================================================"

    CLEANED_OUTPUT=$(cat "$REPORT_PATH" | sed 's/\x1b\[[0-9mAK;]//g')

    PENDING=$(echo "$CLEANED_OUTPUT" | grep -E '([0-9]+ pending)')
    if [[ -n "$PENDING" ]]; then
      echo "  --- Pending Tests ---"
      echo "$PENDING" | sed 's/^/   /'
    fi

    SKIPPED=$(echo "$CLEANED_OUTPUT" | grep -E '([0-9]+ skipped)')
    if [[ -n "$SKIPPED" ]]; then
      echo "  --- Skipped Tests ---"
      echo "$SKIPPED" | sed 's/^/   /'
    fi

    FLAKY=$(echo "$CLEANED_OUTPUT" | grep -E '([0-9]+ flakey|[0-9]+ flaky)')
    if [[ -n "$FLAKY" ]]; then
      echo "  --- Flaky Tests ---"
      echo "$FLAKY" | sed 's/^/   /'
    fi

    FAILED=$(echo "$CLEANED_OUTPUT" | grep -E '([0-9]+ failing|[0-9]+ failed)')
    if [[ -n "$FAILED" ]]; then
      echo "  --- Failed Tests ---"
      echo "$FAILED" | sed 's/^/   /'
    fi
  fi
done
