const hospitalization = require('./hospitalization');
const personel = require('./personel');
const finances = require('./finances');
const status = require('./status');
const types = require('./types');

const FilterParser = require('../../../lib/filter');
// module dependencies
const db = require('../../../lib/db');

module.exports.hospitalization = hospitalization;
module.exports.personel = personel;
module.exports.finances = finances;
module.exports.status = status;
module.exports.types = types;
module.exports.read = read;

function find(options) {
  db.convert(options, ['uuid', 'service_uuid']);

  const filters = new FilterParser(options, { tableAlias : 'ind' });
  const sql = `
    SELECT BUID(ind.uuid) as uuid, ind.period_id, p.start_date as period_start, p.fiscal_year_id,
      f.label as fiscal_year_label, ins.translate_key as status_translate_key, ind.status_id,
      ind.user_id, u.display_name, ind.created_date, BUID(s.uuid) as service_uuid, s.name as service_name,
      t.id as type_id, t.text as type_text, t.translate_key as type_translate_key
    FROM indicator ind
    JOIN period p ON p.id = ind.period_id
    JOIN fiscal_year f ON f.id = p.fiscal_year_id
    LEFT JOIN service s ON s.uuid = ind.service_uuid
    JOIN user u ON u.id = ind.user_id
    JOIN indicator_status ins ON ins.id = ind.status_id
    JOIN indicator_type t ON t.id = ind.type_id
  `;

  filters.equals('user_id');
  filters.equals('status_id');
  filters.equals('period_id');
  filters.equals('type_id');
  filters.equals('service_uuid');
  filters.custom('fiscal_year_id', 'f.id=?');
  filters.period('period', 'created_date');
  filters.dateFrom('custom_period_start', 'created_date');
  filters.dateTo('custom_period_end', 'created_date');

  const resqt = {
    query : filters.applyQuery(sql),
    parameters : filters.parameters(),
  };

  return db.exec(resqt.query, resqt.parameters);
}

// Indicator Variables Registry
async function read(req, res) {
  const indicators = await find(req.query);
  res.status(200).json(indicators);
}
