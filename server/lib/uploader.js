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
 * @requires node:path
 * @requires node:fs
 * @requires env-paths
 * @requires multer
 * @requires debug
 * @requires lib/util
 *  1) Ensure that a max-size is properly handled with error codes
 *  2) Limit the number of files able to be processed at a single go
 */

const path = require('node:path');
const fs = require('node:fs/promises');
const {constants}= require('node:fs');
const multer = require('multer');

const osPaths = require('env-paths').default('bhima');
const debug = require('debug')('bhima:app:uploader');

const { uuid } = require('./util');
const BadRequest = require('./errors/BadRequest');

// configure the uploads directory based on global process variables

/**
 * @function getUploadDirectory
 * @description
 * Returns the upload directory 
 */
function getUploadDirectory() {
  const basePath = process.env.BHIMA_DATA_DIR || osPaths.data;
  const uploadPath = path.resolve(basePath, 'uploads');
  return uploadPath.endsWith(path.sep) ? uploadPath : uploadPath + path.sep;
}

/**
 *
 */
async function ensureUploadDirectoryExists() {
  const uploadPath = getUploadDirectory();
  debug(`Using ${uploadPath} as the upload directory.`);
  await fs.mkdir(uploadPath, { recursive: true});
  await fs.access(uploadPath, constants.R_OK | constants.W_OK);
  debug(`Successfully created ${uploadPath}.`);
}


/**
 * @class
 * @description
 * A middleware wrapper for multer to generate unique filenames and store files
 * in the upload directory.
 * @param {string} prefix - the directory name to prefix paths with (required)
 * @param {string} fields - the name given to the files uploaded (required)
 */
function Uploader(prefix, fields) {
  const uploadDirectory = getUploadDirectory();

  // configure the storage space using multer's diskStorage.  This will allow
  const storage = multer.diskStorage({
    destination : (req, file, cb) => { cb(null, uploadDirectory); },
    filename : (req, file, cb) => {
      const id = uuid();
      const linkDirectory = path.resolve(uploadDirectory, prefix);
      file.link = path.resolve(linkDirectory, id);
      debug(`Storing file in ${file.link}.`);
      cb(null, id);
    },
  });

  const onegigabyte = 1073741824;
  return multer({ storage, limits : { fileSize : onegigabyte } }).array(fields);
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

ensureUploadDirectoryExists();


// attach the relative upload directory path for outside consumption
exports.directory = getUploadDirectory();

// export the uploader
exports.middleware = Uploader;
exports.hasFilesToUpload = hasFilesToUpload;
