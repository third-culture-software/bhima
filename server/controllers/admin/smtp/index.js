/**
 * @overview SMTP Configuration Controller
 *
 * @description
 * This controller manages SMTP email configuration stored in the database,
 * to allow the server to send emails to users when necessary.
 */

const router = require('express').Router();
const db = require('../../../lib/db');
const mailer = require('../../../lib/mailer');

/**
 * @method list
 * @description Get all SMTP configurations
 * GET /smtp
 */
async function list(req, res) {
  const sql = `
    SELECT id, smtp_host, smtp_port, smtp_secure, smtp_username, 
           from_address, from_name, created_at, updated_at
    FROM smtp_configuration 
    ORDER BY created_at DESC
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
 * @method detail
 *
 * @description Get a specific SMTP configuration
 * GET /smtp/:id
 */
async function detail(req, res) {
  const sql = `
    SELECT id, smtp_host, smtp_port, smtp_secure, smtp_username, 
           from_address, from_name, created_at, updated_at
    FROM smtp_configuration 
    WHERE id = ?
  `;

  const row = await db.one(sql, [req.params.id]);
  res.status(200).json(row);
}

/**
 * @method create
 * @description Create a new SMTP configuration
 * POST /smtp
 */
async function create(req, res) {
  const record = req.body;
  const sql = 'INSERT INTO smtp_configuration SET ?';

  delete record.id;

  // Set default values
  Object.assign(record, { smtp_port : 587, smtp_secure : 0 });
  const result = await db.exec(sql, [record]);

  // Refresh mailer configuration
  await mailer.refreshMailerConfig();
  res.status(201).json({ id : result.insertId });
}

/**
 * @method update
 * @description Update an existing SMTP configuration
 * PUT /smtp/:id
 */
async function update(req, res) {
  const sql = 'UPDATE smtp_configuration SET ? WHERE id = ?';
  const record = req.body;

  delete record.id;

  await db.exec(sql, [record, req.params.id]);
  // Refresh mailer configuration
  await mailer.refreshMailerConfig();

  return detail(req, res);
}

/**
 * @method remove
 * @description Delete an SMTP configuration
 * DELETE /smtp/:id
 */
async function remove(req, res) {
  await db.delete(
    'smtp_configuration', 'id', req.params.id, res,
    `Could not find an smtp configuration with id ${req.params.id}`,
  );

  mailer.refreshMailerConfig();
}
/**
 * @method testConnection
 * @description Test SMTP connection with given configuration
 * POST /smtp/test-connection
 */
async function testConnection(req, res) {
  const config = req.body;

  // test the credentials to make sure they are valid.
  try {
    await mailer.verifyCredentials({
      host : config.smtp_host,
      port : config.smtp_port || 587,
      secure : config.smtp_secure || false,
      auth : {
        user : config.smtp_username,
        pass : config.smtp_password,
      },
    });

    res.status(200).json({ success : true, message : 'SMTP connection test successful' });
  } catch (err) {
    res.status(400).json({ success : false, message : err.message });
  }
}

router.get('/', list);
router.get('/:id', detail);
router.post('/test-connection', testConnection);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
