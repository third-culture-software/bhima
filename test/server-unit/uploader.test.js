const { after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '../..');
const clientRoot = path.resolve(repoRoot, 'client');
const uploaderPath = path.resolve(repoRoot, 'server/lib/uploader');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bhima-uploader-test-'));

after(() => fs.rmSync(temporaryRoot, { recursive : true, force : true }));

function loadUploadDirectory(value, extraEnvironment = {}) {
  const environment = {
    ...process.env,
    HOME : temporaryRoot,
    ...extraEnvironment,
  };

  if (value === undefined) {
    delete environment.BHIMA_DATA_DIR;
  } else {
    environment.BHIMA_DATA_DIR = value;
  }

  return spawnSync(process.execPath, ['-e', `process.stdout.write(require(${JSON.stringify(uploaderPath)}).directory);`], {
    cwd : repoRoot,
    env : environment,
    encoding : 'utf8',
  });
}

function assertOutsideClient(uploadDirectory) {
  const relative = path.relative(clientRoot, uploadDirectory);
  assert.ok(relative === '..' || relative.startsWith(`..${path.sep}`), `${uploadDirectory} must be outside client/`);
}

describe('test/server-unit/uploader', () => {
  it('uses the env-paths fallback when BHIMA_DATA_DIR is unset', () => {
    const result = loadUploadDirectory(undefined);
    assert.equal(result.status, 0, result.stderr);
    assertOutsideClient(result.stdout);
  });

  it('uses the env-paths fallback when BHIMA_DATA_DIR is empty', () => {
    const result = loadUploadDirectory('');
    assert.equal(result.status, 0, result.stderr);
    assertOutsideClient(result.stdout);
  });

  it('accepts an explicit data directory outside client/', () => {
    const dataDirectory = path.join(temporaryRoot, 'bhima-data');
    const result = loadUploadDirectory(dataDirectory);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `${path.resolve(dataDirectory, 'uploads')}${path.sep}`);
  });

  it('keeps the sample BHIMA_DATA_DIR empty', () => {
    const sample = dotenv.parse(fs.readFileSync(path.resolve(repoRoot, '.env.sample')));
    assert.equal(sample.BHIMA_DATA_DIR, '');
  });
});
