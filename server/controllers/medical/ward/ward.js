const db = require('../../../lib/db');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.read = read;
module.exports.detail = detail;

// register a new ward
function create(req, res, next) {
  const data = req.body;
  data.uuid = db.bid(data.uuid || db.uuid());
  db.convert(data, ['service_uuid']);
  const sql = 'INSERT INTO ward SET ?';

  db.exec(sql, data).then(() => {
    res.sendStatus(201);
  })
    .catch(next);
}

// modify a ward informations
function update(req, res, next) {
  const data = req.body;

  delete data.uuid;
  db.convert(data, ['service_uuid']);

  const uuid = db.bid(req.params.uuid);

  // if no service is set back, make it null
  if (!data.service_uuid) { data.service_uuid = null; }

  const sql = 'UPDATE ward SET ? WHERE uuid = ?';

  db.exec(sql, [data, uuid])
    .then(() => { res.sendStatus(200); })
    .catch(next);
}

// delete a patient
function remove(req, res, next) {
  const uuid = db.bid(req.params.uuid);
  const sql = `DELETE FROM ward WHERE uuid=?`;

  db.exec(sql, uuid).then(() => {
    res.sendStatus(204);
  })
    .catch(next);
}

// get all wards
function read(req, res, next) {
  const sql = `
    SELECT BUID(w.uuid) as uuid, w.name,
      w.description, BUID(w.service_uuid) as service_uuid,
      s.name as serviceName,
      (SELECT COUNT(*) FROM room WHERE room.ward_uuid = w.uuid) AS nb_rooms,
      (SELECT COUNT(*) FROM bed JOIN room ir ON ir.uuid = bed.room_uuid WHERE ir.ward_uuid = w.uuid) AS nb_beds
    FROM ward w
    LEFT JOIN service s ON s.uuid = w.service_uuid
  `;

  db.exec(sql).then(wards => {
    res.status(200).json(wards);
  })
    .catch(next);
}

// get a specific ward
function detail(req, res, next) {
  const sql = `
    SELECT BUID(uuid) as uuid, name, description, BUID(service_uuid) as service_uuid
    FROM ward
    WHERE uuid=?
  `;
  const uuid = db.bid(req.params.uuid);
  db.one(sql, uuid).then(ward => {
    res.status(200).json(ward);
  })
    .catch(next);
}
