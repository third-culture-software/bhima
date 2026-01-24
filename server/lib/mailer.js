/**
 * @file mailer
 * @description
 * This module contains a wrapper for SMTP emailing.
 * @requires nodemailer
 * @requires debug
 */

const debug = require('debug')('bhima:mailer');
const nodemailer = require('nodemailer');

// get ENV variables.
const {
  SMTP_HOST,
  SMTP_USERNAME,
  SMTP_PASSWORD,
} = process.env;

let mailer;

/**
 *
 */
function setupSMTPTransport() {
  debug(`#setupSMTPTransport() Using ${SMTP_HOST} for email transport.`);
  const transport = nodemailer.createTransport({
    host : SMTP_HOST,
    port : 587,
    secure : false,
    auth : { user : SMTP_USERNAME, pass : SMTP_PASSWORD },
  }, { from : SMTP_USERNAME });

  // check SMTP credentials
  transport.verify((err) => {
    if (err) {
      debug(`#setupSMTPTransport() Error connecting to ${SMTP_HOST} as ${SMTP_USERNAME} on port 587.`);
      debug(`#setupSMTPTransport() Error: ${JSON.stringify(err)}`);
    } else {
      debug(`#setupSMTPTransport() ${SMTP_HOST} is ready to accept connections.`);
    }
  });

  // alias sendMail() as send();
  transport.send = transport.sendMail;
  return transport;
}

// only set up transports
if (SMTP_HOST && SMTP_USERNAME && SMTP_PASSWORD) {
  mailer = setupSMTPTransport();
} else {
  debug(`#setupSMTPTransport() did not find SMTP host, username, and password.  Skipping SMTP configuration.`);
  debug(`#setupSMTPTransport() the server will not be able to send emails.`);
}

/**
 * @param address
 * @param subject
 * @param message
 * @param options
 * @function email
 * @description
 * This function implements emailing with nicer handling of file names than the
 * default smtp library.
 */
exports.email = async function email(address, subject, message, options = {}) {
  if (!mailer) {
    debug(`#email() mail transport not set up.  Skipping email to ${address}.`);
    return 0;
  }

  debug(`#email() sending email "${subject}" to ${address}.`);

  // attachments:
  // https://nodemailer.com/message/attachments/
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

  const result = await mailer.send(mail);

  debug(`#email() sent.  Result is:`, result);
  return result;
};
