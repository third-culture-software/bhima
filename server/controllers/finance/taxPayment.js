const db = require('../../lib/db');

// HTTP Controller
exports.availablePaymentPeriod = async function availablePaymentPeriod(req, res) {
  const sql = `
    SELECT
      p.id, p.config_tax_id, p.config_rubric_id, p.config_accounting_id, p.config_cotisation_id,
      p.label, p.dateFrom, p.dateTo, r.label AS RUBRIC, t.label AS TAX, a.label AS account,
      c.label AS cotisation
    FROM
      payment_period p, config_rubric r, config_tax t, config_accounting a,
      config_cotisation c
    WHERE p.config_tax_id = t.id
      AND p.config_rubric_id = r.id
      AND a.id=p.config_accounting_id
      AND p.config_cotisation_id = c.id
      ORDER BY p.id DESC
  `;

  const result = await db.exec(sql);
  res.send(result);
};

exports.setTaxPayment = async function setTaxPayment(req, res) {
  const sql = `
    UPDATE tax_payment SET posted = 1 ' +
    WHERE tax_payment.payment_uuid=${db.escape(req.body.payment_uuid)}
      AND tax_payment.tax_id = ${db.escape(req.body.tax_id)};
  `;

  const result = await db.exec(sql);
  res.send(result);
};
