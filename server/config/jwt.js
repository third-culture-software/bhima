const jwt = require('jsonwebtoken');
const debug = require('debug')('bhima:jwt');

const config = {
  secret : process.env.SESS_SECRET,
};

// Validate that the secret exists
if (!config.secret) {
  throw new Error('SESS_SECRET environment variable is required for JWT functionality');
}

function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        reject(err);
        debug('Error: token verification failed!');
      } else {
        debug('Success: JWT token verification succeeded!');
        resolve(decoded);
      }
    });
  });
}

function create(jsondata, options = {}) {
  const defaultOptions = {
    expiresIn : 86400, // expires in 24 hours
    issuer : 'bhima-app',
    audience : 'bhima-users',
  };

  return jwt.sign(jsondata, config.secret, { ...defaultOptions, ...options });
}

module.exports = {
  verify,
  create,
  config,
};
