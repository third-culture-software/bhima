/**
 * This file provides system information for the /settings page.
 * @requires node:os
 * @requires node:fs/promises
 * @requires debug
 */

const os = require('node:os');
const debug = require('debug')('bhima:app:system:info');
const { constants } = require('node:fs');
const { readFile, access } = require('node:fs/promises');

// GET system/info
exports.info = info;

/**
 *
 */
async function resolvePkgPath() {
  const paths = [
    '../../../../package.json',
    '../../../package.json',
    '../../package.json',
  ];

  const resolutions = await Promise.allSettled(paths.map(p => access(p, constants.R_OK)));
  const pkgPath = resolutions
    .map((p, idx) => p.status === 'fulfilled' ? idx : undefined)
    .filter(idx => idx !== undefined)
    .at(0);

  if (pkgPath) {
    debug('Found package.json at %s', pkgPath);
  } else {
    debug('Could not find package.json in any of the expected locations.');
  }

  return pkgPath;
}

// send operating system information
/**
 *
 * @param req
 * @param res
 */
async function info(req, res) {
  // platform information string
  const platformString = `${os.platform()}-${os.arch()}-${os.release()}`;

  // try to get information on the BHIMA version.
  const pkgPath = await resolvePkgPath();
  let version;
  if (pkgPath) {
    const contents = await readFile(pkgPath, 'utf-8');
    let pkg = JSON.parse(contents);
    version = pkg.version;
  } else {
    version = 'UNKNOWN';
  }

  // data to be returned to the client
  const data = {
    platform : platformString,
    numCPUs : os.cpus().length,
    machineUptime : os.uptime() * 1000, // change to milliseconds
    processUptime : process.uptime() * 1000, // change to milliseconds
    memoryUsage : (1 - (os.freemem() / os.totalmem())) * 100, // percentage
    version : version,
    memory : (os.totalmem() / (1024 ** 2)), // change to  MB
  };

  // respond with the system statistics
  res.status(200).json(data);
}
