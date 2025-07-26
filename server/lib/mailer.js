/**
 * @overview mailer
 *
 * @description
 * This module contains a wrapper for SMTP emailing with database configuration.
 *
 * @requires nodemailer
 * @requires debug
 * @require lib/db
 */

const debug = require('debug')('bhima:mailer');
const nodemailer = require('nodemailer');
const db = require('./db');

let mailer;

/**
 * @function getConfigFromDatabase
 * @description Retrieves the active SMTP configuration from the database
 */
async function getConfigFromDatabase() {
  const sql = `
    SELECT smtp_host, smtp_port, smtp_secure, smtp_username, 
           smtp_password, from_address, from_name
    FROM smtp_configuration 
    ORDER BY id DESC 
    LIMIT 1
  `;

  try {
    const config = await db.one(sql);
    debug('#getConfigFromDatabase() Retrieved SMTP config from database.');
    return config;
  } catch (err) {
    debug('#getConfigFromDatabase() No active SMTP configuration found in database.');
    return null;
  }
}

/**
 * @function setupSMTPTransport
 * @description Creates SMTP transport using database or environment configuration
 */
async function setupSMTPTransport(config) {
  const smtpConfig = config || {
    smtp_host : process.env.SMTP_HOST,
    smtp_port : process.env.SMTP_PORT || 587,
    smtp_secure : process.env.SMTP_SECURE === 'true',
    smtp_username : process.env.SMTP_USERNAME,
    smtp_password : process.env.SMTP_PASSWORD,
    from_address : process.env.SMTP_USERNAME,
  };

  if (!smtpConfig.smtp_host || !smtpConfig.smtp_username || !smtpConfig.smtp_password) {
    debug('#setupSMTPTransport() Missing required SMTP configuration.');
    return null;
  }

  debug(`#setupSMTPTransport() Using ${smtpConfig.smtp_host} for email transport.`);

  const transport = nodemailer.createTransport({
    host : smtpConfig.smtp_host,
    port : smtpConfig.smtp_port,
    secure : smtpConfig.smtp_secure,
    auth : {
      user : smtpConfig.smtp_username,
      pass : smtpConfig.smtp_password,
    },
  }, {
    from : `${smtpConfig.from_name || ''} <${smtpConfig.from_address}>`,
  });

  // check SMTP credentials
  try {
    await transport.verify();
    debug(`#setupSMTPTransport() ${smtpConfig.smtp_host} is ready to accept connections.`);
  } catch (err) {
    debug(`#setupSMTPTransport() Error connecting to ${smtpConfig.smtp_host}.`);
    debug(`#setupSMTPTransport() Error: ${JSON.stringify(err)}`);
    return null;
  }

  // alias sendMail() as send();
  transport.send = transport.sendMail;
  return transport;
}

function verifyCredentials(config) {
  const transport = nodemailer.verifyCredentials({
    host : config.smtp_host,
    port : config.smtp_port || 587,
    secure : config.smtp_secure || false,
    auth : {
      user : config.smtp_username,
      pass : config.smtp_password,
    },
  });

  return transport.verify();
}

/**
 * @function initializeMailer
 * @description Initialize mailer with database config or fallback to environment
 */
async function initializeMailer() {
  try {
    const dbConfig = await getConfigFromDatabase();
    mailer = await setupSMTPTransport(dbConfig);

    if (!mailer) {
      debug('#initializeMailer() Failed to setup SMTP transport. Email functionality disabled.');
    }
  } catch (err) {
    debug('#initializeMailer() Error initializing mailer:', err);
  }
}

/**
 * @function refreshMailerConfig
 * @description Refresh mailer configuration from database
 */
async function refreshMailerConfig() {
  await initializeMailer();
}

/**
 * @method email
 * @description Send email with automatic config refresh if needed
 */
exports.email = async function email(address, subject, message, options = {}) {
  // Initialize mailer if not done or refresh if config might have changed
  if (!mailer) {
    await initializeMailer();
  }

  if (!mailer) {
    debug(`#email() mail transport not set up. Skipping email to ${address}.`);
    return 0;
  }

  debug(`#email() sending email "${subject}" to ${address}.`);

  const { attachments } = options;

  if (attachments) {
    debug(`#email(): found attachments`, JSON.stringify(attachments));
  }

  const mail = {
    to : address,
    subject,
    attachments,
    text : message,
  };

  if (options.bcc) {
    debug(`#email() BCC-ed addresses: `, options.bcc.join(', '));
    Object.assign(mail, { bcc : options.bcc });
  }

  try {
    const result = await mailer.send(mail);
    debug(`#email() sent. Result is:`, result);
    return result;
  } catch (err) {
    debug(`#email() Error sending email:`, err);
    // Try to refresh config and retry once
    await refreshMailerConfig();

    if (mailer) {
      const result = await mailer.send(mail);
      debug(`#email() sent after config refresh. Result is:`, result);
      return result;
    }

    throw err;
  }
};

// Export the refresh function for use by the API
exports.refreshMailerConfig = refreshMailerConfig;
exports.verifyCredentials = verifyCredentials;

// Initialize on module load
initializeMailer();
