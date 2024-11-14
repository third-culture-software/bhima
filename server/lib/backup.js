/**
 * @overview backup
 *
 * @description
 * This file contains a collection of tools to automate backups of the BHIMA
 * database.
 */

const debug = require('debug')('backups');
const tmp = require('tempy');
const zlib = require('zlib');
const streamToPromise = require('stream-to-promise');
const fs = require('fs');
const moment = require('moment');
const nutil = require('node:util');
const util = require('./util');

const exec = nutil.promisify(require('node:child_process').exec);

/**
 * @method backup
 *
 * @description
 * This function runs all the backup functions in order from dump to upload.  It
 * should probably be tested live in production to see if this is actually
 * something we want to do before calling it all the time.
 */
function backup(filename) {
  const file = filename || tmp.file({ extension : '.sql' });

  debug(`#backup() beginning backup routine.`);

  return mysqldump(file)
    .then(() => gzip(file))
    .then(upload);
}

/**
 * @function mysqldump
 *
 * @description
 * This function runs mysqldump on the database with provided options.  There is
 * a switch to allow the user to dump the schema as necessary.
 */
function mysqldump(file, options = {}) {
  const cmd = `mysqldump %s > ${file}`;

  debug(`#mysqldump() dumping database ${options.includeSchema ? 'with' : 'without'} schema.`);

  // this is an array to make it easy to add or remove options
  const flags = [
    `--user=${process.env.DB_USER}`,
    `-p${process.env.DB_PASS}`,
    `--databases ${process.env.DB_NAME}`,

    // compress information between the client and server in case we are on a
    // networked database.
    '--compress',

    // wrap everything in a START TRANSACTION and COMMIT at the end.
    '--single-transaction',

    // preserve UTF-8 names in the database dump.  These can be removed manually
    // if we need to remove it.
    '--set-charset',

    // make sure binary data is dumped out as hexadecimal.
    '--hex-blob',

    // retrieve rows one row at a time instead of buffering the entire table in memory
    '--quick',

    // do not pollute the dump with comments
    '--skip-comments',

    // show every column name in the INSERT statements.  This helps with later
    // database migrations.
    '--complete-insert',

    // speed up the dump and rebuild of the database.
    '--disable-keys',

    // building the dump twice should produce no side-effects.
    '--add-drop-database',
    '--add-drop-table',
  ];

  // do not dump schemas by default.  If we want create info, we can turn it on.
  if (!options.includeSchema) {
    flags.push('--no-create-info');
  }

  // make sure stored procedures are dumped with build
  if (options.includeSchema) {
    flags.push('--routines');
  }

  const program = util.format(cmd, flags.join(' '));

  return exec(program);
}

/**
 * @function gzip
 *
 * @description
 * This function uses the native zlib library for ultra-fast compression of the
 * backup file.  Since streams are used, the memory requirements should stay
 * relatively low.
 */
async function gzip(file) {
  const outfile = `${file}.gz`;

  debug(`#gzip() compressing ${file} into ${outfile}.`);

  const input = fs.createReadStream(file);
  const output = fs.createWriteStream(outfile);

  const stats = await fs.promises.stat(file);
  const beforeSizeInMegabytes = stats.size / 1000000.0;
  debug(`#gzip() ${file} is ${beforeSizeInMegabytes}MB`);

  // start the compresion
  const streams = input
    .pipe(zlib.createGunzip())
    .pipe(output);

  await streamToPromise(streams);

  const statsAfter = await fs.promises.stat(outfile);
  const afterSizeInMegabytes = statsAfter.size / 1000000.0;
  debug(`#gzip() ${outfile} is ${afterSizeInMegabytes}MB`);

  const ratio = Number(beforeSizeInMegabytes / afterSizeInMegabytes).toFixed(2);

  debug(`#gzip() compression ratio: ${ratio}`);

  return outfile;
}

/**
 * @method upload
 *
 * @description
 * This function uploads a file to Amazon S3 storage.
 */
function upload(file, options = {}) {
  debug(`#upload() Not Implemented Yet!`);

  if (!options.name) {
    options.name = `${process.env.DB_NAME}-${moment().format('YYYY-MM-DD')}.sql.gzip`;
  }
}

exports.backup = backup;
exports.mysqldump = mysqldump;
exports.upload = upload;
exports.gzip = gzip;
