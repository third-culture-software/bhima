/**
 * @file
 * This file provides system information for the /settings page.
 * @requires os
 * @requires lib/db
 */

const os = require('os');

// this path is correct _when compiled_
const pkg = require('../../../package.json');

// GET system/info
exports.info = info;

// send operating system information
/**
 *
 * @param req
 * @param res
 */
function info(req, res) {
  // platform information string
  const platformString = `${os.platform()}-${os.arch()}-${os.release()}`;

  // data to be returned to the client
  const data = {
    platform : platformString,
    numCPUs : os.cpus().length,
    machineUptime : os.uptime() * 1000, // change to milliseconds
    processUptime : process.uptime() * 1000, // change to milliseconds
    memoryUsage : (1 - (os.freemem() / os.totalmem())) * 100, // percentage
    version : pkg.version,
    memory : (os.totalmem() / (1024 ** 2)), // change to  MB
  };

  // respond with the system statistics
  res.status(200).json(data);
}
