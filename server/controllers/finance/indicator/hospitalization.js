const db = require('../../../lib/db');
const { uuid } = require('../../../lib/util');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.detail = detail;

async function create(req, res) {
  const { indicator, hospitalization } = req.body;

  db.convert(indicator, ['uuid', 'service_uuid']);

  indicator.uuid = indicator.uuid ? indicator.uuid : db.bid(uuid());
  indicator.user_id = req.session.user.id;

  hospitalization.uuid = hospitalization.uuid ? db.bid(hospitalization.uuid) : db.bid(uuid());
  hospitalization.indicator_uuid = indicator.uuid;

  const transaction = db.transaction();
  const indicatorSql = `INSERT INTO indicator SET ?`;
  const hospitalizationSql = `INSERT INTO hospitalization_indicator SET ?`;

  transaction.addQuery(indicatorSql, indicator);
  transaction.addQuery(hospitalizationSql, hospitalization);

  await transaction.execute();
  res.sendStatus(201);
}

async function update(req, res) {
  const { indicator, hospitalization } = req.body;
  db.convert(hospitalization, ['indicator_uuid', 'service_uuid']);
  db.convert(indicator, ['service_uuid']);
  const _uuid = db.bid(req.params.uuid);
  delete hospitalization.uuid;
  delete indicator.uuid;

  const transaction = db.transaction();
  const indicatorSql = `UPDATE indicator SET ? WHERE uuid = ?`;
  const hospitalizationSql = `UPDATE hospitalization_indicator SET ? WHERE indicator_uuid = ?`;

  transaction.addQuery(indicatorSql, [indicator, _uuid]);
  transaction.addQuery(hospitalizationSql, [hospitalization, _uuid]);

  await transaction.execute();
  res.sendStatus(200);
}

async function remove(req, res) {
  const _uuid = db.bid(req.params.uuid);

  const indicatorSql = `
    DELETE FROM indicator
    WHERE uuid = ?
  `;

  const hospitalizationSql = `DELETE FROM hospitalization_indicator WHERE indicator_uuid = ?`;

  const transaction = db.transaction();
  transaction.addQuery(hospitalizationSql, _uuid);
  transaction.addQuery(indicatorSql, _uuid);

  await transaction.execute();
  res.sendStatus(200);
}

async function detail(req, res) {
  const _uuid = db.bid(req.params.uuid);

  const query = `
    SELECT
      BUID(i.uuid) as uuid, i.status_id, i.period_id, i.user_id, i.type_id, BUID(i.service_uuid) as service_uuid,
      hi.total_day_realized, hi.total_beds, hi.total_external_patient,
      hi.total_hospitalized_patient, hi.total_death, s.name as service_name,
      p.fiscal_year_id
    FROM indicator i
    JOIN service s ON s.uuid = i.service_uuid
    JOIN period p ON p.id = i.period_id
    JOIN hospitalization_indicator hi ON hi.indicator_uuid = i.uuid
    WHERE i.uuid = ?
  `;

  const rows = await db.one(query, _uuid);
  res.status(200).json(rows);
}
