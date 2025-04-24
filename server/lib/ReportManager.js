/* eslint global-require:off */
/**
 * @overview ReportManager
 *
 * @description
 * The report manager is a wrapper for bhima's reporting capabilities, providing
 * easy ways to create JSON/HTML/PDF reports from templates and data.
 *
 * @todo
 *  1. Create a generic Report API for reading reports from the database and
 *    sending them back to the client.
 *
 * @requires lodash
 * @requires debug
 * @requires path
 * @requires tempy
 * @requires lib/util
 * @requires lib/helpers/translate
 * @requires lib/errors/BadRequest
 * @requires lib/errors/InternalServerError
 * @requires lib/db
 */

const _ = require('lodash');
const debug = require('debug')('ReportManager');
const path = require('path');
const tempy = require('tempy');
const datauri = require('datauri');
const fs = require('fs/promises');
const db = require('./db');
const util = require('./util');
const translateHelper = require('./helpers/translate');
const BadRequest = require('./errors/BadRequest');
const InternalServerError = require('./errors/InternalServerError');

const { FORCE_HTML_RECEIPT_RENDERER } = process.env;

// renderers
const renderers = {
  json : require('./renderers/json'),
  html : require('./renderers/html'),
  pdf : require('./renderers/pdf'),
  csv : require('./renderers/csv'),
  xlsx : require('./renderers/xlsx'),
  xls : require('./renderers/xls'),
  doc : require('./renderers/doc'),
  xlsxReceipt : require('./renderers/xlsxReceipt'),
  xlsxReport : require('./renderers/xlsxReport'),
};

// default report configuration
const defaults = {
  pageSize : 'A4',
  orientation : 'portrait',
  lang : 'en',
  renderer : 'pdf',
};

// Constants
const SAVE_DIR = process.env.REPORT_DIR || tempy.directory();

// create if not exist SAVE_DIR
util.createDirectory(SAVE_DIR);

const SAVE_SQL = `
  INSERT INTO saved_report SET ?;
`;

function getFileName(options, extension) {
  const translate = translateHelper(options.lang);
  const translatedName = translate(options.filename);
  const fileDate = new Date().toLocaleDateString();
  const formattedName = `${translatedName} ${fileDate}`;
  const fileName = `${formattedName}${extension}`;
  return [translatedName, encodeURIComponent(fileName)];
}

// Class Declaration

class ReportManager {
  /**
   * @constructor
   *
   * @description
   * The ReportManager takes in a template path information and rendering
   * options.  It returns an instance of the report manager, ready to be
   * prepared with session data and rendered with data.
   *
   * @param {String} templatePath - the path to the template file
   * @param {Object} metadata - any metadata that needs to appear in the report
   * @param {Object} options - rendering + default options for the report
   */
  constructor(templatePath, metadata, options) {
    this.options = _.clone(options || {});

    // merge options into default options
    _.defaults(this.options, defaults);

    // default to the session user
    if (metadata && metadata.user) {
      this.options.user = metadata.user;
    }

    // normalize the path for different operating systems
    this.template = path.normalize(templatePath);

    // manually override the rendering if this flag is set
    if (FORCE_HTML_RECEIPT_RENDERER) {
      this.options.renderer = 'html';
    }

    // set the renderer based on the provided options
    this.renderer = renderers[this.options.renderer || this.defaults.renderer];

    if (!this.renderer) {
      throw new BadRequest(
        `The application does not support rendering ${options.renderer}.`,
        'ERRORS.INVALID_RENDERER',
      );
    }

    // @TODO user information could be determined by report manager, removing the need for this check
    if (this.options.saveReport && !this.options.user) {
      const invalidSaveDescription = 'Report cannot be saved without providing a `user` entity to ReportManager';
      throw new InternalServerError(invalidSaveDescription);
    }

    // remove render-specific options
    delete options.renderer;
    delete options.csvKey;
    delete options.filename;
    delete options.lang;

    // set the metadata
    this.metadata = metadata;
    delete this.metadata.path;
  }

  /**
   * @method render
   *
   * @description
   * This method renders the final report as needed.
   *
   * @param {Object} data - the report data to be passed to the renderer's
   *    render() function.
   */
  async render(data) {
    const { metadata, renderer } = this;

    // set the render timestamp
    metadata.timestamp = new Date();

    // prune extraneous paths
    delete metadata.paths;

    // @TODO fit this better into the code flow
    // sanitise save report option
    this.options.saveReport = Boolean(Number(this.options.saveReport));

    // check if the enterprise has a logo, and normalize the path to absolute
    // Use the IMA application icon as the default logo if nothing else exists
    const logoPath = metadata.enterprise?.logo || './client/assets/IMAicon.jpg';
    metadata.enterprise.logopath = path.isAbsolute(logoPath)
      ? logoPath
      : path.resolve(logoPath);

    // check if the project has a logo, and normalize the path to absolute
    const projectLogoPath = metadata.project.logo;

    if (projectLogoPath) {
      metadata.project.logopath = path.isAbsolute(projectLogoPath)
        ? projectLogoPath
        : path.resolve(projectLogoPath);
    }

    try {
      await fs.access(metadata.enterprise.logopath, fs.constants.R_OK);
      metadata.enterprise.logoDataURI = await datauri(
        metadata.enterprise.logopath,
      );

      if (metadata.project.logopath) {
        await fs.access(metadata.project.logopath, fs.constants.R_OK);
        metadata.project.logoDataURI = await datauri(
          metadata.project.logopath,
        );
      }

    } catch (e) {
      debug('No enterprise logo available');
    }

    // merge the data object before templating
    _.merge(data, { metadata });

    // some reports(Excel,..) require renaming result's column names
    // so, util.renameKeys can help to solve this problem
    const { displayNames, renameKeys } = this.options;

    const rowsToRename = data.rows || data[this.options.rowsDataKey];

    data.rows = renameKeys
      ? util.renameKeys(rowsToRename, displayNames)
      : rowsToRename;

    let defaultTitle;
    let fileName;
    if (this.options.filename) {
      [defaultTitle, fileName] = getFileName(
        this.options,
        this.renderer.extension,
      );
    }

    // set the report title to the filename if no title is given
    data.title = data.title || defaultTitle;

    // render the report using the stored renderer
    const report = await renderer.render(data, this.template, this.options);

    const renderHeaders = renderer.headers;

    if (fileName) {
      renderHeaders['Content-Disposition'] = `filename="${fileName}"`;
      renderHeaders.filename = fileName;
    }

    // if we are supposed to save the report, call the save method.
    if (this.options.saveReport) {
      await this.save(report);
    }

    return { headers : renderHeaders, report };
  }

  /**
   * @method save
   *
   * @description
   * This method saves the report in the report directory to be looked up later.
   */
  async save(stream) {
    if (!stream) {
      debug('Stream error:', JSON.stringify(stream));
      throw new Error(`
        ReportManger.render() must be called and completed before saving the report.
      `);
    }

    // generate a unique id for the report name
    const reportId = util.uuid();
    const { options } = this;

    // make the report name using the
    const fname = reportId + this.renderer.extension;
    const link = path.join(SAVE_DIR, fname);

    const data = {
      uuid : db.bid(reportId),
      label : options.label,
      link,
      timestamp : new Date(),
      user_id : options.user.id,
      report_id : options.reportId,
    };

    await fs.writeFile(link, stream);
    await db.exec(SAVE_SQL, data);

    return { uuid : reportId };
  }
}

module.exports = ReportManager;
