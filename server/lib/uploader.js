/**
 * @module uploader
 * @description
 * This module is responsible for configuring uploading middleware for the
 * server using multer.  It should be injected as a middleware in routes that
 * require uploads to be handled with a directory name for prefixing the
 * uploads.
 * @example
 * const uploader = require('./lib/uploader');
 * const app = require('express')();
 * const routes = require('./routes');
 *
 * app.post('/some/route', uploader.middleware('directoryName', 'fieldNames'),
 *   routes.controller);
 * @requires path
 * @requires multer
 * @requires fs
 * @requires debug
 * @requires lib/util
 * @todo
 *  1) Ensure that a max-size is properly handled with error codes
 *  2) Limit the number of files able to be processed at a single go
 */

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const debug = require('debug')('app:uploader');

const { uuid } = require('./util');
const BadRequest = require('./errors/BadRequest');

// configure the uploads directory based on global process variables
const defaultDir = 'uploads';
const dir = process.env.UPLOAD_DIR || defaultDir;
// NOTE: 'dir' must be a relative path (for http requests to work)
if (path.isAbsolute(dir) || dir.startsWith('..')) {
  throw new Error(`UPLOAD_DIR (${dir}) must be a relative path within the BHIMA software installation!`);
}
const rootDir = path.resolve(`${__dirname}/../..`);
const fsdir = path.join(rootDir, dir); // global path
debug('ROOT dir: ', rootDir);
debug('UPLOAD_DIR: ', dir);
debug('UPLOAD_DIR Abs dir: ', fsdir);

if (!process.env.UPLOAD_DIR) {
  debug(
    `The environmental variable $UPLOAD_DIR is undefined.  The application will use ${dir} as the upload directory.`,
  );
}

// attach the relative upload directory path for outside consumption
exports.directory = dir;

// export the uploader
exports.middleware = Uploader;
exports.hasFilesToUpload = hasFilesToUpload;

const mkdirp = (dpath) => fs.promises.mkdir(dpath, { recursive : true });

/**
 * @class
 * @description
 * A middleware wrapper for multer to generate unique filenames and store files
 * in the upload directory.
 * @param {string} prefix - the directory name to prefix paths with (required)
 * @param {string} fields - the name given to the files uploaded (required)
 */
function Uploader(prefix, fields) {
  // format the upload directory.  Add a trailing slash for consistency
  const hasTrailingSlash = (prefix[prefix.length - 1] === '/');
  const linkDirectory = path.join(dir, hasTrailingSlash ? prefix : `${prefix}/`);

  // configure the storage space using multer's diskStorage.  This will allow
  const storage = multer.diskStorage({
    destination : async (req, file, cb) => {

      try {
        // NOTE: need absolute path here for mkdirp
        const fullFolderPath = path.join(fsdir, hasTrailingSlash ? prefix : `${prefix}/`);
        debug(`creating upload directory ${fullFolderPath}.`);
        await mkdirp(fullFolderPath);
        cb(null, fullFolderPath);
      } catch (err) {
        cb(err);
      }
    },
    filename : (req, file, cb) => {
      const id = uuid();

      // ensure that a link is passed to the req.file object
      file.link = `${linkDirectory}${id}`;
      debug(`Storing file in ${file.link}.`);
      cb(null, id);
    },
  });

  // set up multer as the middleware
  return multer({ storage }).array(fields);
}

/**
 * @param req
 * @param res
 * @param next
 * @function hasFilesToUpload
 * @description
 * A middleware which check if files to upload are present, if not throw an error
 */
function hasFilesToUpload(req, res, next) {
  if (!req.files || req.files.length === 0) {
    const errorDescription = 'Expected at least one file upload but did not receive any files.';
    const errorDetails = new BadRequest(errorDescription, 'ERRORS.MISSING_UPLOAD_FILES');
    next(errorDetails);
  }
  next();
}
