#!/bin/bash
set -euo pipefail

if [[ ! -d results ]]; then
  echo "There are no test results!"
  echo
  exit 0
fi

# Strip ANSI escape sequences in place, portably (no dependence on GNU vs BSD
# sed's differing -i syntax, and no dependence on \x escape support in sed --
# the ESC byte is produced by bash's ANSI-C quoting before sed ever sees it).
strip_ansi() {
  local file="$1"
  local tmp
  tmp=$(mktemp)
  sed -E $'s/\x1b\\[[0-9;]*[a-zA-Z]//g' "$file" >"$tmp"
  mv "$tmp" "$file"
}

# Grep that never trips `set -e` when there's simply no match.
# Forwards all args (not just $1/$2) so callers can pass flags like -i
# ahead of the pattern and file, e.g. `find_line -i 'FAIL' "$file"`.
find_line() {
  grep -E "$@" 2>/dev/null || true
}

print_field() {
  local label="$1" value="$2"
  if [[ -n "$value" ]]; then
    echo "   $label: $value"
  fi
}

# Shared shape for the "X passing, Y pending, Z failing"-style reports
# (integration, stock integration, e2e account).
print_group_report() {
  local title="$1" file="$2"
  [[ -f "$file" ]] || return 0

  strip_ansi "$file"
  echo "$title"
  echo "  $(find_line 'passing|passed' "$file")"
  print_field "Pending" "$(find_line 'pending' "$file")"
  print_field "Skipped" "$(find_line 'skipped' "$file")"
  print_field "Flaky" "$(find_line 'flakey|flaky' "$file")"
  print_field "Failed" "$(find_line 'failing|failed' "$file")"
  echo
}

echo "TEST RESULTS SUMMARY"
echo

# Client unit tests have their own report shape (TOTAL / FAIL), so handle
# separately rather than forcing it into print_group_report.
CLIENT_REPORT="./results/client-unit-report"
if [[ -f "$CLIENT_REPORT" ]]; then
  strip_ansi "$CLIENT_REPORT"
  echo "Client Unit Tests"
  echo "    $(find_line 'TOTAL' "$CLIENT_REPORT" | sed -e 's/TOTAL: //')"
  print_field "Failed" "$(find_line -i 'FAIL' "$CLIENT_REPORT")"
  echo
fi

print_group_report "Integration Tests" "./results/integration-report"
print_group_report "Stock Integration Tests" "./results/integration-stock-report"
print_group_report "End-to-end account tests (Playwright)" "./results/end-to-end-report-account"

# Numbered end-to-end reports. Glob instead of a hardcoded {1..8} range so a
# 9th (or 5th, or however many) report is never silently skipped, and
# restrict to digits so this can't also match end-to-end-report-account.
shopt -s nullglob
for report in ./results/end-to-end-report-[0-9]*; do
  n="${report##*-}"
  echo "================================================"
  echo "End-to-end tests $n (Playwright)"
  echo "================================================"
  strip_ansi "$report"

  pending=$(find_line '[0-9]+ pending' "$report")
  skipped=$(find_line '[0-9]+ skipped' "$report")
  flaky=$(find_line '[0-9]+ flaky' "$report")
  failed=$(find_line '[0-9]+ failed' "$report")

  [[ -n "$pending" ]] && {
    echo "  --- Pending Tests ---"
    echo "   $pending"
  }
  [[ -n "$skipped" ]] && {
    echo "  --- Skipped Tests ---"
    echo "   $skipped"
  }
  [[ -n "$flaky" ]] && {
    echo "  --- Flaky Tests ---"
    echo "   $flaky"
  }
  [[ -n "$failed" ]] && {
    echo "  --- Failed Tests ---"
    echo "   $failed"
  }
done
