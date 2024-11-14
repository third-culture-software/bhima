const db = require('../../../lib/db');
const { uuid } = require('../../../lib/util');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.detail = detail;

function create(req, res, next) {
  const { indicator, personel } = req.body;
  indicator.uuid = indicator.uuid ? db.bid(indicator.uuid) : db.bid(uuid());
  indicator.user_id = req.session.user.id;

  personel.uuid = personel.uuid ? db.bid(personel.uuid) : db.bid(uuid());
  personel.indicator_uuid = indicator.uuid;

  const transaction = db.transaction();
  const indicatorSql = `INSERT INTO indicator SET ?`;
  const personelSql = `INSERT INTO staff_indicator SET ?`;

  transaction.addQuery(indicatorSql, indicator);
  transaction.addQuery(personelSql, personel);

  transaction.execute().then(() => {
    res.sendStatus(201);
  }).catch(next);
}

function update(req, res, next) {
  const { indicator, personel } = req.body;
  db.convert(personel, ['indicator_uuid']);
  const _uuid = db.bid(req.params.uuid);
  delete personel.uuid;
  delete indicator.uuid;

  const transaction = db.transaction();
  const indicatorSql = `UPDATE indicator SET ? WHERE uuid=?`;
  const personelSql = `UPDATE staff_indicator SET ? WHERE indicator_uuid=?`;

  transaction.addQuery(indicatorSql, [indicator, _uuid]);
  transaction.addQuery(personelSql, [personel, _uuid]);

  transaction.execute().then(() => {
    res.sendStatus(200);
  }).catch(next);
}

function remove(req, res, next) {
  const _uuid = db.bid(req.params.uuid);

  const indicatorSql = `
    DELETE FROM indicator
    WHERE uuid = ?
  `;
  const personelSql = `DELETE FROM staff_indicator WHERE indicator_uuid=?`;

  const transaction = db.transaction();
  transaction.addQuery(personelSql, _uuid);
  transaction.addQuery(indicatorSql, _uuid);

  transaction.execute().then(() => {
    res.sendStatus(200);
  }).catch(next);
}

async function detail(req, res, next) {
  const _uuid = db.bid(req.params.uuid);

  const query = `
    SELECT 
      BUID(i.uuid) as uuid, i.status_id, i.period_id, i.user_id, i.type_id,
      hi.total_day_realized,
      hi.total_hospitalized_patient, hi.total_doctors, hi.total_nurses, total_caregivers,
      hi.total_staff, hi.total_external_visit, hi.total_visit, hi.total_surgery_by_doctor,
      p.fiscal_year_id
    FROM indicator i
    JOIN period p ON p.id = i.period_id
    JOIN staff_indicator hi ON hi.indicator_uuid = i.uuid
    WHERE i.uuid = ?
  `;

  try {
    const rows = await db.one(query, _uuid);
    res.status(200).json(rows);

  } catch (error) {
    next(error);
  }

}
