const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.read = read;
module.exports.detail = detail;

// register a new bed
function create(req, res, next) {
  const data = req.body;
  db.convert(data, ['room_uuid']);
  data.user_id = req.session.user.id;
  const sql = 'INSERT INTO bed SET ?';
  db.exec(sql, data)
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);
}

// modify a bed informations
function update(req, res, next) {
  const { id } = req.params;
  let data = req.body;

  if (data.room_uuid) {
    data = db.convert(data, ['room_uuid']);
  }

  delete data.id;
  const sql = `UPDATE bed SET ? WHERE id = ?;`;
  db.exec(sql, [data, id])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next);
}

// delete a bed
function remove(req, res, next) {
  const { id } = req.params;
  const sql = `DELETE FROM bed WHERE id = ?;`;

  db.exec(sql, [id])
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
}

// get all beds
function read(req, res, next) {
  lookupBeds(req.query)
    .then(beds => {
      res.status(200).json(beds);
    })
    .catch(next);
}

// get a specific bed
function detail(req, res, next) {
  lookupBed(req.params.id)
    .then(bed => {
      res.status(200).json(bed);
    })
    .catch(next);
}

// lookup beds
function lookupBeds(options) {
  db.convert(options, ['ward_uuid', 'room_uuid']);

  const sql = `
    SELECT b.id, b.label, b.is_occupied,
      BUID(r.uuid) as room_uuid, r.label AS room_label,
      BUID(w.uuid) AS ward_uuid, w.name AS ward_name, w.description,
      s.name as service_name
    FROM bed b
    JOIN room r ON r.uuid = b.room_uuid
    JOIN ward w ON w.uuid = r.ward_uuid
    LEFT JOIN service s ON s.uuid = w.service_uuid
  `;

  const filters = new FilterParser(options);
  filters.equals('is_occupied');
  filters.equals('ward_uuid', 'uuid', 'w');
  filters.equals('room_uuid', 'uuid', 'r');
  filters.setOrder('ORDER BY ward_name, room_label, label');

  const query = filters.applyQuery(sql);
  const queryParameters = filters.parameters();
  return db.exec(query, queryParameters);
}

// lookup bed
function lookupBed(id) {
  const sql = `
    SELECT b.id, b.label, b.is_occupied,
      BUID(r.uuid) as room_uuid, r.label AS room_label, 
      BUID(w.uuid) AS ward_uuid, w.name AS ward_name, w.description,
      s.name as service_name
    FROM bed b
    JOIN room r ON r.uuid = b.room_uuid
    JOIN ward w ON w.uuid = r.ward_uuid
    LEFT JOIN service s ON s.uuid = w.service_uuid
    WHERE b.id = ?
  `;
  return db.one(sql, [id]);
}
