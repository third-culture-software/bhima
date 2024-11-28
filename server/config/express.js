/**
 * @overview
 * The application's middleware configuration.
 *
 * @todo - this could probably be separated by functionality.
 */

const express = require('express');
const session = require('express-session');
// NOTE: connect-redis now automatically imports the session data from
//       express-session. See the migration notes in
//       https://github.com/tj/connect-redis/releases/tag/v7.0.0
const { RedisStore } = require('connect-redis');
const Redis = require('ioredis');
const morgan = require('morgan');
const helmet = require('helmet');

const debug = require('debug')('app');
const debugHTTP = require('debug')('http');
const access = require('./access');
const interceptors = require('./interceptors');
const uploads = require('../lib/uploader');

// accept generic express instances (initialised in app.js)
exports.configure = function configure(app) {
  // TODO - things don't work well yet.
// const isProduction = (process.env.NODE_ENV === 'production');
  const isProduction = false;

  debug('configuring middleware.');

  // helmet guards
  app.use(helmet({
    contentSecurityPolicy : {
      useDefaults : false,
      directives : {
        defaultSrc : ['\'self\'', '\'unsafe-inline\'', 'blob:'],
        fontSrc : ['\'self\'', 'https://fonts.gstatic.com'],
        imgSrc : ['\'self\'', 'blob:', 'data:'],
      },
    },
  }));

  app.use(express.json({ limit : '8mb' }));
  app.use(express.urlencoded({ extended : false }));

  // this will disable the session from expiring on the server (redis-session)
  // during development
  const disableTTL = !isProduction;

  // stores session in a file store so that server restarts do not interrupt
  // client sessions.
  const sess = {
    store : new RedisStore({
      disableTTL,
      client : new Redis({ host : process.env.REDIS_HOST }),
    }),
    secret            : process.env.SESS_SECRET,
    resave            : false,
    saveUninitialized : false,
    unset             : 'destroy',
    cookie            : { httpOnly : true },
    retries           : 20,
  };

  // indicate that we are running behind a trust proxy and should use a secure cookie
  if (isProduction) {
    app.set('trust proxy', true);
    sess.cookie.secure = true;
  }

  // bind the session to the middleware
  app.use(session(sess));

  /**
   * @function overrideIndexCacheHeaders
   *
   * @description
   * Prevents the browser from caching index.html so that we don't have to tell our clients
   * to clear their cache every system upgrade. All other pages can be cached as normal.
   */
  function overrideIndexCacheHeaders(res, path) {
    const isIndexPage = path.includes('client/index.html');
    if (isIndexPage) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }

  app.use(express.static('client/', { setHeaders : overrideIndexCacheHeaders }));
  app.use(`/${uploads.directory}`, express.static(uploads.directory));

  // manage user access( by session or token)
  access(app);

  // provide a stream for morgan to write to
  const stream = {
    write : message => debugHTTP(message.trim()),
  };

  // http logger setup
  // options: combined | common | dev | short | tiny
  app.use(morgan('short', { stream }));
};

// configures error handlers
exports.errorHandling = function errorHandling(app) {
  app.use(interceptors.handler);
};
