#!/bin/bash

if [[ ! -d results ]]; then
  echo "There are no test results!"
  echo
  exit
fi

echo "TEST RESULTS SUMMARY"
echo
if test -f "./results/client-unit-report"; then
  sed -i -e 's/\x1b\[[0-9;]*m//g' ./results/client-unit-report # Remove ANSI move sequences that disrupts the display
  echo "Client Unit Tests"
  echo "  " "$(grep \"TOTAL\" ./results/client-unit-report)"
  failed=$(grep -i "FAIL" ./results/client-unit-report)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi
if test -f "./results/server-unit-report"; then
  sed -i -e 's/\x1b\[[0-9;]*m//g' ./results/server-unit-report # Remove ANSI move sequences that disrupts the display
  echo "Server Unit Tests"
  echo "  " "$(grep 'passing' ./results/server-unit-report)"
  failed=$(grep 'failing' ./results/server-unit-report)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi
if test -f "./results/integration-report"; then
  sed -i -e 's/\x1b\[[0-9;]*m//g' ./results/integration-report # Remove ANSI move sequences that disrupts the display
  echo "Integration Tests"
  echo "  " "$(grep 'passing' ./results/integration-report)"
  pending=$(grep -E 'pending' ./results/integration-report)
  if [ "$pending" ]; then echo "   $pending"; fi
  failed=$(grep -E 'failing' ./results/integration-report)
  if [ "$failed" ]; then echo "   $failed"; fi
  echo
fi
if test -f "./results/integration-stock-report"; then
  sed -i -e 's/\x1b\[[0-9;]*m//g' ./results/integration-stock-report # Remove ANSI move sequences that disrupts the display
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
  sed -i -e 's/\x1b\[[0-9;]*m//g' ./results/end-to-end-report-account # Remove ANSI move sequences that disrupts the display
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

# Show all the E2E tests, if available
for i in {1..8}; do
  if test -f "./results/end-to-end-report-$i"; then
    sed -i -e 's/\x1b\[[0-9;]*m//g' "./results/end-to-end-report-$i" # Remove ANSI move sequences that disrupts the display
    echo "End-to-end tests $i (Playwright)"
    echo "  " "$(grep 'passed' ./results/end-to-end-report-$i)"
    pending=$(grep -E '([0-9]+ pending)' "./results/end-to-end-report-$i")
    if [ "$pending" ]; then echo "   $pending"; fi
    skipped=$(grep -E '([0-9]+ skipped)' "./results/end-to-end-report-$i")
    if [ "$skipped" ]; then echo "   $skipped"; fi
    flaky=$(grep -E '([0-9]+ flakey|[0-9]+ flaky)' "./results/end-to-end-report-$i")
    if [ "$flaky" ]; then echo "   $flaky"; fi
    failed=$(grep -E '([0-9]+ failing|[0-9]+ failed)' "./results/end-to-end-report-$i")
    if [ "$failed" ]; then echo "   $failed"; fi
    echo
  fi
done
