# bash strict mode
set -euo pipefail

# Make sure results directory exists
if [[ ! -d results ]]; then
  echo "Creating 'results' directory"
  mkdir results
fi

./sh/build-stock-database.sh || {
  echo 'failed to build DB'
  exit 1
}

echo "[test]"

echo "[test] Spawning server process..."
# build the server
./node_modules/.bin/gulp build

echo "[test] running tests using mocha"
# run the tests
SUITE_NAME="BHIMA Stock Integration Tests" MOCHA_OUTPUT="results/integration-stock-report.xml" ./node_modules/.bin/mocha test/integration-stock --timeout 20000 \
  --reporter mocha-multi-reporters --reporter-options configFile="mocha-reporter-options.js" 2>&1 | tee ./results/integration-stock-report

echo "[/test]"
