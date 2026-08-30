const debug = require('debug')('app');
const JWTConfig = require('./jwt');
const { Unauthorized } = require('../lib/errors');
const { loadSessionInformation } = require('../controllers/auth');

const publicRoutes = [
  'POST /auth/login',
  'GET /helpdesk_info',
  'GET /languages',
  'GET /projects',
  'GET /projects/',
  'GET /auth/logout',
  'GET /install',
  'POST /install',
  'GET /currencies',
];

module.exports = (app) => {
  app.use(async (req, res, next) => {
    const token = req.headers['x-access-token'];
    const method = req.method === 'HEAD' ? 'GET' : req.method;

    if (token) {
      const user = await JWTConfig.verify(token);
      const session = await loadSessionInformation(user);
      Object.assign(req.session, session);
    }

    if ((req.session.user === undefined) && !within(`${method} ${req.path}`, publicRoutes)) {
      debug(`Rejecting unauthorized access to ${req.path} from ${req.ip}`);
      throw new Unauthorized('You are not logged into the system.');
    }
    // go to the next middleware
    next();
  });

};

// quick way to find out if a value is in an array
/**
 *
 * @param value
 * @param array
 */
function within(value, array) { return array.includes(value.trim()); }
