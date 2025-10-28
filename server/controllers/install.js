/**
 * @overview Install
 *
 * @description
 * This module is responsible for setting up a new bhima instance
 * by configuring administrator user, enterprise, project, etc.
 *
 * @requires lib/db
 * @requires lib/errors/BadRequest
 * @requires fs/promises
 * @requires path
 */

const debug = require('debug')('install');
const fs = require('fs/promises');
const path = require('path');
const db = require('../lib/db');
const BadRequest = require('../lib/errors/BadRequest');

/**
 * @const DEFAULTS
 *
 * @description
 * The default values for users, enterprises, and projects.
 */
const DEFAULTS = {
  user : { id : 1, display_name : 'System Administrator' },
  enterprise : { id : 1 },
  project : { id : 1, locked : 0, enterprise_id : 1 },
  settings : { enterprise_id : 1 },
};

/**
 * @const SQL_MODELS_PATH
 *
 * @description
 * Path to the SQL models directory
 */
const SQL_MODELS_PATH = path.join(__dirname, '../models');

/**
 * @function getSQLFiles
 *
 * @description
 * Discovers all SQL files in the server/models/ directory and sorts them
 * in ascending order by filename.
 *
 * @returns {Promise<Array>} Array of sorted SQL file paths
 */
async function getSQLFiles() {
  try {
    const files = await fs.readdir(SQL_MODELS_PATH);

    // Filter for .sql files and sort them
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    debug(`Found ${sqlFiles.length} SQL files:`, sqlFiles);

    return sqlFiles.map(file => path.join(SQL_MODELS_PATH, file));
  } catch (error) {
    debug('Error reading SQL files:', error);
    throw error;
  }
}

/**
 * @function checkSchemaExists
 *
 * @description
 * Checks if the database schema already exists by checking for critical tables.
 *
 * @returns {Promise<boolean>} true if schema exists, false otherwise
 */
async function checkSchemaExists() {
  try {
    // Check if critical tables exist
    const query = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name IN ('user', 'enterprise', 'project', 'account')
    `;

    const result = await db.one(query);
    const schemaExists = result.count >= 4;

    debug(`Schema exists check: ${schemaExists} (found ${result.count} critical tables)`);

    return schemaExists;
  } catch (error) {
    debug('Error checking schema existence:', error);
    // If we can't query, assume schema doesn't exist
    return false;
  }
}

/**
 * @function executeSQLFile
 *
 * @description
 * Executes a single SQL file by reading its contents and executing it as a whole.
 * This handles complex SQL files with DELIMITER statements, stored procedures,
 * functions, and triggers properly.
 *
 * @param {String} filePath - Path to the SQL file
 * @returns {Promise} Resolves when execution is complete
 */
async function executeSQLFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    debug(`Executing SQL file: ${fileName}`);

    const sqlContent = await fs.readFile(filePath, 'utf8');

    if (!sqlContent.trim()) {
      debug(`Skipping empty file: ${fileName}`);
      return;
    }

    // Get a connection from the pool with multipleStatements enabled
    const connection = await db.pool.getConnection();

    try {
      // Parse the SQL file to handle DELIMITER commands
      const processedSQL = processSQLWithDelimiters(sqlContent);

      // Execute all statements sequentially
      // eslint-disable-next-line no-restricted-syntax
      for (const statement of processedSQL) {
        if (statement.trim()) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await connection.query(statement);
          } catch (error) {
            // Log the error but continue with other statements for idempotency
            // Only ignore errors related to objects that already exist
            const ignorableErrors = [
              'ER_TABLE_EXISTS_ERROR',
              'ER_DUP_KEYNAME',
              'ER_SP_ALREADY_EXISTS',
              'ER_DB_CREATE_EXISTS',
            ];

            if (!ignorableErrors.includes(error.code)) {
              debug(`Error executing statement in ${fileName}:`, error.message);
              // Re-throw non-ignorable errors
              throw error;
            }
            debug(`Ignoring duplicate object error in ${fileName}: ${error.code}`);
          }
        }
      }

      debug(`Successfully executed SQL file: ${fileName}`);
    } finally {
      connection.release();
    }
  } catch (error) {
    debug(`Error executing SQL file ${filePath}:`, error);
    throw error;
  }
}

/**
 * @function processSQLWithDelimiters
 *
 * @description
 * Processes SQL content that may contain DELIMITER commands, splitting
 * the content into executable statements based on the active delimiter.
 *
 * @param {String} sqlContent - The SQL file content
 * @returns {Array<String>} Array of SQL statements ready to execute
 */
function processSQLWithDelimiters(sqlContent) {
  const statements = [];
  let currentDelimiter = ';';
  let buffer = '';

  // Split by newlines to process line by line
  const lines = sqlContent.split('\n');

  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for DELIMITER command
    if (trimmedLine.match(/^DELIMITER\s+(.+)$/i)) {
      // Save any buffered content with the old delimiter
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = '';
      }

      // Update the delimiter
      const match = trimmedLine.match(/^DELIMITER\s+(.+)$/i);
      currentDelimiter = match[1].trim();
      // eslint-disable-next-line no-continue
      continue;
    }

    // Add line to buffer
    buffer += `${line}\n`;

    // Check if we've hit the current delimiter
    if (trimmedLine.endsWith(currentDelimiter)) {
      // Remove the delimiter from the end
      const statement = buffer.substring(0, buffer.lastIndexOf(currentDelimiter)).trim();
      if (statement) {
        statements.push(statement);
      }
      buffer = '';
    }
  }

  // Add any remaining content
  if (buffer.trim()) {
    statements.push(buffer.trim());
  }

  // Filter out comments and empty statements
  return statements.filter(stmt => {
    const trimmed = stmt.trim();
    return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
  });
}

/**
 * @function setupDatabaseSchema
 *
 * @description
 * Sets up the database schema by executing all SQL files in the server/models/
 * directory. This function is idempotent and will not fail if objects already exist.
 *
 * @returns {Promise} Resolves when schema setup is complete
 */
async function setupDatabaseSchema() {
  try {
    debug('Starting database schema setup');

    // Check if schema already exists
    const schemaExists = await checkSchemaExists();

    if (schemaExists) {
      debug('Database schema already exists, skipping setup');
      return;
    }

    // Get all SQL files sorted by filename
    const sqlFiles = await getSQLFiles();

    if (sqlFiles.length === 0) {
      debug('No SQL files found in models directory');
      return;
    }

    // Execute each SQL file in order sequentially
    // eslint-disable-next-line no-restricted-syntax
    for (const filePath of sqlFiles) {
      // eslint-disable-next-line no-await-in-loop
      await executeSQLFile(filePath);
    }

    debug('Database schema setup completed successfully');
  } catch (error) {
    debug('Error setting up database schema:', error);
    throw error;
  }
}

/**
 * @method basicInstallExist
 *
 * @description
 * Checks if the basic information for the installation exist; if it doesn't,
 * we can perform a new installation.
 *
 */
async function basicInstallExist() {
  // check users, enterprise, projects
  const userExist = 'SELECT COUNT(*) >= 1 AS has_users FROM user;';
  const enterpriseExist = 'SELECT COUNT(*) >= 1 AS has_enterprises FROM enterprise;';
  const projectExist = 'SELECT COUNT(*) >= 1 AS has_projects FROM project;';

  const [users, enterprises, projects] = await Promise.all([
    db.one(userExist),
    db.one(enterpriseExist),
    db.one(projectExist),
  ]);

  return !!(users.has_users || enterprises.has_enterprises || projects.has_projects);
}

/**
 * GET /install
 *
 * @function checkBasicInstallExist
 *
 * @description
 * Exposes the checkBasicInstallExist method to the API
 */
exports.checkBasicInstallExist = async (req, res) => {
  const isInstalled = await basicInstallExist();
  res.status(200).json({ isInstalled });
};

/**
 * @function defaultEnterpriseLocation
 *
 * @description
 * Grabs the first village in the database as the default enterprise location.
 */
function defaultEnterpriseLocation() {
  return db.one(`SELECT uuid FROM village LIMIT 1;`);
}

/**
 * POST /install
 *
 * @function proceedInstall
 *
 * @description
 * Proceed to the application installation
 */
exports.proceedInstall = async (req, res) => {
  const { enterprise, project, user } = req.body;

  const isInstalled = await basicInstallExist();

  if (isInstalled) {
    throw new BadRequest('The application is already installed');
  }

  // Setup database schema if it doesn't exist
  await setupDatabaseSchema();

  const location = await defaultEnterpriseLocation();
  await createEnterpriseProjectUser(enterprise, project, user, location.uuid);
  res.redirect('/');
};

/**
 * @function createEnterpriseProjectUser
 *
 * @description
 * Creates the basic components of the installation: the enterprise, a default project,
 * and the user with superuser permissions.
 */
function createEnterpriseProjectUser(enterprise, project, user, locationUuid) {

  // assign default properties
  Object.assign(user, DEFAULTS.user);
  Object.assign(enterprise, DEFAULTS.enterprise, { location_id : locationUuid });
  Object.assign(project, DEFAULTS.project);

  if (user.repassword) {
    delete user.repassword;
  }

  // prepare transactions
  const sqlEnterprise = 'INSERT INTO enterprise SET ? ';
  const sqlEnterpriseSettings = 'INSERT INTO enterprise_setting SET ?';
  const sqlProject = 'INSERT INTO project SET ? ';
  const sqlUser = 'INSERT INTO user (username, password, display_name) VALUES (?, MYSQL5_PASSWORD(?)  , ?);';
  const sqlRole = `CALL superUserRole(${user.id})`;
  const sqlProjectPermission = 'INSERT INTO project_permission SET ? ';

  return db.transaction()
    .addQuery(sqlEnterprise, enterprise)
    .addQuery(sqlEnterpriseSettings, DEFAULTS.settings)
    .addQuery(sqlProject, project)
    .addQuery(sqlUser, [user.username, user.password, user.display_name])
    .addQuery(sqlProjectPermission, { user_id : user.id, project_id : project.id })
    .addQuery(sqlRole)
    .execute();
}

// Export schema setup function for external use
exports.setupDatabaseSchema = setupDatabaseSchema;
