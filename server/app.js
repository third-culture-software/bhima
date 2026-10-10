/**
 * @file server
 * Basic Hospital Information Management Application
 *
 * This is the central server of bhima.  It is responsible for setting up the
 * HTTP server, logging infrastructure, and environmental variables.  These are
 * global throughout the application, and are configured here.
 *
 * The application routes are configured in {@link server/config/routes}, while
 * the middleware is configured in {@link server/config/express}.
 * @requires http
 * @requires dotenv
 * @requires express
 * @requires debug
 * @requires config/express
 * @requires config/routes
 * @license GPL-2.0
 * @copyright IMA World Health 2016
 */

require('dotenv').config();
require('use-strict');

const http = require('node:http');
const process = require('node:process');
const express = require('express');
const debug = require('debug')('app');

const app = express();

// Configure application middleware stack, inject authentication session
require('./config/express').configure(app);

// Link routes
require('./config/routes').configure(app);

// link error handling
require('./config/express').errorHandling(app);


/**
 * Boots an HTTP server wrapping the app and resolves once it's actually
 * listening. Pass { port: 0 } to let the OS assign a free port.
 * @param options
 */
function start(options = {}) {
  const port = options.port ?? process.env.PORT ?? 0;

  return new Promise((resolve, reject) => {
    const httpServer = http.createServer(app);
    httpServer.once('error', reject);
    httpServer.listen(port, () => {
      httpServer.removeListener('error', reject);
      debug(`start(): listening on port ${httpServer.address().port}`);
      resolve(httpServer);
    });
  });
}

/**
 * Gracefully closes the server and the redis client backing sessions.
 * @param httpServer
 */
async function stop(httpServer) {
  if (httpServer) {
    await new Promise((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  }

  const redisClient = app.get('redisClient');
  if (redisClient?.isOpen) await redisClient.quit();
}

process.on('uncaughtException', (e) => { debug('%o', e); process.exit(1); });
process.on('unhandledRejection', (e) => { debug('%o', e); process.exit(1); });
process.on('warning', (w) => debug('%o', w));

module.exports ={ app, start, stop }

// Only bind a port when this file is executed directly.
if (require.main === module) {
  start().catch((err) => { debug('%o', err); process.exit(1); });
}
