/**
 * HTTP END POINT
 * API controller for the table cron_email_report
 */
const debug = require('debug')('bhima:cron');
const Cron = require('cron').CronJob;
const pRetry = require('p-retry');

const { setTimeout } = require('node:timers/promises');

const delay = (ms) => setTimeout(ms);

const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

const mailer = require('../../../lib/mailer');
const auth = require('../../auth');
const dbReports = require('../../report.handlers');
const { addDynamicDatesOptions } = require('./utils');

const CURRENT_JOBS = new Map();

const DEVELOPER_ADDRESS = 'developers@imaworldhealth.org';
const DEFAULT_LANGUAGE = 'fr';
const RETRY_COUNT = 5;

function find(options = {}) {
  const filters = new FilterParser(options, { tableAlias : 'cer' });
  const sql = `
    SELECT
      cer.id, cer.entity_group_uuid, cer.cron_id, cer.report_id,
      cer.params, cer.label, cer.last_send,
      cer.next_send, cer.has_dynamic_dates,
      eg.label AS entity_group_label,
      c.label AS cron_label, c.value AS cron_value,
      r.report_key, r.title_key
    FROM cron_email_report cer
    JOIN entity_group eg ON eg.uuid = cer.entity_group_uuid
    JOIN cron c ON c.id = cer.cron_id
    JOIN report r ON r.id = cer.report_id
  `;

  filters.equals('id');
  filters.equals('report_id');
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();
  return db.exec(query, parameters);
}

function lookup(id) {
  const query = `
    SELECT
      cer.id, cer.entity_group_uuid, cer.cron_id, cer.report_id,
      cer.params, cer.label, cer.last_send,
      cer.next_send, cer.has_dynamic_dates,
      eg.label AS entity_group_label,
      c.label AS cron_label, c.value AS cron_value,
      r.report_key, r.title_key
    FROM cron_email_report cer
    JOIN entity_group eg ON eg.uuid = cer.entity_group_uuid
    JOIN cron c ON c.id = cer.cron_id
    JOIN report r ON r.id = cer.report_id
    WHERE cer.id = ?;
  `;
  return db.one(query, [id]);
}

function list(req, res, next) {
  find(req.query)
    .then(rows => res.status(200).json(rows))
    .catch(next)
    
}

function details(req, res, next) {
  lookup(req.params.id)
    .then((data) => res.status(200).json(data))
    .catch(next)
    
}

/**
 * @function removeJob
 *
 * @description
 * The opposite of addJob().  It haults a job from running, and removes it from the
 * list of current jobs.
 */
function removeJob(id) {
  const jobToStop = CURRENT_JOBS.get(id);

  if (jobToStop) {
    jobToStop.job.stop();
    debug(`The job for "${jobToStop.label}" is stopped`);
    CURRENT_JOBS.delete(id);
  }

}

function remove(req, res, next) {
  const query = `
    DELETE FROM cron_email_report WHERE id = ?;
  `;
  const ident = parseInt(req.params.id, 10);

  db.exec(query, [ident])
    .then(() => removeJob(ident))
    .then(() => res.sendStatus(204))
    .catch(next)
    
}

async function create(req, res, next) {
  try {
    const query = 'INSERT INTO cron_email_report SET ?;';
    const { cron, reportOptions } = req.body;

    db.convert(cron, ['entity_group_uuid']);
    cron.params = JSON.stringify(reportOptions);

    const result = await db.exec(query, [cron]);
    const created = await lookup(result.insertId);
    await createEmailReportJob(created, sendEmailReportDocument, created);

    res.status(201).json({ id : result.insertId });
  } catch (error) {
    next(error);
  }
}

function send(req, res, next) {
  const { id } = req.params;
  lookup(id)
    .then(record => sendEmailReportDocument(record))
    .then(() => res.sendStatus(201))
    .catch(next);
}

/**
 * @function addJob
 * @description add a cron job to run each time for the given pattern
 * @param {string} frequency Cron job pattern * * * * *
 * @param {function} cb the function to run
 * @param {any} params params of the function
 */
function addJob(frequency, cb, ...params) {
  const job = new Cron(frequency, () => cb(...params));
  job.start();

  const nextRunDate = job.nextDate().toFormat('yyyy-MM-dd HH:mm:ss');
  debug(`Added and started new job.  Next run at: ${nextRunDate}`);
  return job;
}

/**
 * @method launchCronEmailReportJobs
 * @description at the startup, read all cron email reports
 * in the database and create jobs for them
 */
async function launchCronEmailReportJobs() {
  try {
    debug('beginning scan of saved automated email reports.');
    const session = await loadSession();
    if (!session.enterprise.settings.enable_auto_email_report) { return; }

    const records = await find();
    if (!records.length) { return; }

    const jobs = records.map(record => createEmailReportJob(record, sendEmailReportDocument, record));
    await Promise.all(jobs);

    debug('Reports scanned successfully');
  } catch (error) {
    debug(error);
  }
}

/**
 * @function createEmailReportJob
 * @param {object} record A row of cron email report
 * @param {function} cb The function to run
 */
function createEmailReportJob(record, cb, ...params) {
  const job = addJob(record.cron_value, cb, ...params);
  CURRENT_JOBS.set(record.id, { id : record.id, label : record.label, job });
  return updateCronEmailReportNextSend(record.id, job);
}

/* eslint-disable max-len */
const content = `
To whom it may concern,

You are subscribed to automated reports from the BHIMA software installation at %ENTERPRISE%.  Please find attached the following reports:

  - %FILENAME%

Thank you,
The BHIMA team
`;
/* eslint-enable max-len */

/**
 * @function sendEmailReportDocument
 * @param {object} record A row of cron email report
 * @param {object} options The report options
 */
async function sendEmailReportDocument(record) {
  try {
    const contacts = await loadContacts(record.entity_group_uuid);

    if (contacts.length === 0) {
      debug(`No contacts found for automated report ${record.label} (${record.report_id}).`);
      debug(`Report will not send.  Exiting.`);
      return;
    }

    let options = JSON.parse(record.params);
    // dynamic dates in the report params if needed
    if (record.has_dynamic_dates) {
      options = addDynamicDatesOptions(record.cron_id, options);
    }

    // add in default language if the language isn't specified.
    if (!options.lang) {
      options.lang = DEFAULT_LANGUAGE;
    }

    const fn = dbReports[record.report_key];

    const session = await loadSession();
    const document = await fn(options, session);
    const filename = replaceSlash(document.headers.filename);

    const attachments = [
      { filename, stream : document.report },
    ];

    // template in the temporary variables
    const body = content
      .replace('%ENTERPRISE%', session.enterprise.name)
      .replace('%FILENAME%', filename)
      .trim();

    const addresses = contacts.map(addr => addr.trim());

    // eslint-disable-next-line
    function sendEmailToSubscribers() {
      return mailer.email(DEVELOPER_ADDRESS, record.label, body, { attachments, bcc : addresses });
    }

    await pRetry(sendEmailToSubscribers, {
      retries : RETRY_COUNT,
      onFailedAttempt : async (error) => {
        // eslint-disable-next-line
        debug(`(${record.label}) Sending report failed with ${error.toString()}. Attempt ${error.attemptNumber} of ${RETRY_COUNT}.`);

        // delay by 10 seconds
        await delay(10000);
      },
    });

    await updateCronEmailReportLastSend(record.id);
    debug(`(${record.label}) report sent by email to ${contacts.length} contacts`);
  } catch (e) {
    debug(e);
  }
}

function replaceSlash(name = '', value = '_') {
  const regex = /\//gi;
  return name.replace(regex, value);
}

function loadContacts(entityGroupUuid) {
  const query = `
    SELECT e.email FROM entity e
    JOIN entity_group_entity ege ON ege.entity_uuid = e.uuid
    JOIN entity_group eg ON eg.uuid = ege.entity_group_uuid
    WHERE eg.uuid = ?;
  `;
  return db.exec(query, [entityGroupUuid])
    .then(contacts => contacts.map(c => c.email));
}

function loadSession() {
  const query = `
    SELECT
      user.id, user.username, user.display_name, user.email, user.deactivated,
      project.enterprise_id , project.id AS project_id
    FROM user
      JOIN project_permission
      JOIN project ON user.id = project_permission.user_id
      AND project.id = project_permission.project_id
      LIMIT 1`;

  return db.one(query)
    .then(user => auth.loadSessionInformation(user));
}

function updateCronEmailReportNextSend(id, job) {
  const sql = `
    UPDATE cron_email_report SET ? WHERE id = ?;
  `;
  const params = {
    next_send : job.nextDate() ? job.nextDate().toJSDate() : null,
  };
  return db.exec(sql, [params, id]);
}

function updateCronEmailReportLastSend(id) {
  const sql = `
    UPDATE cron_email_report SET ? WHERE id = ?;
  `;
  const params = {
    last_send : new Date(),
  };
  return db.exec(sql, [params, id]);
}

launchCronEmailReportJobs();

exports.list = list;
exports.details = details;
exports.remove = remove;
exports.create = create;
exports.send = send;
