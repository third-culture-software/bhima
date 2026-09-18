const path = require('node:path');

const isProduction = (process.env.NODE_ENV === 'production');
const isDevelopment = (process.env.NODE_ENV !== 'production');
const CLIENT_FOLDER = path.resolve(__dirname, '../bin/client');
module.exports = { isProduction, isDevelopment, CLIENT_FOLDER };
