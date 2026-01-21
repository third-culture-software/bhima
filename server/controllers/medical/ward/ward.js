const db = require('../../../lib/db');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.read = read;
module.exports.detail = detail;

// register a new ward
async function create(req, res) {
  const data = req.body;
  data.uuid = db.bid(data.uuid || db.uuid());
  db.convert(data, ['service_uuid']);
  const sql = 'INSERT INTO ward SET ?';

  await db.exec(sql, data);
  res.sendStatus(201);
}

// modify a ward informations
async function update(req, res) {
  const data = req.body;

  delete data.uuid;
  db.convert(data, ['service_uuid']);

  const uuid = db.bid(req.params.uuid);

  // if no service is set back, make it null
  if (!data.service_uuid) { data.service_uuid = null; }

  const sql = 'UPDATE ward SET ? WHERE uuid = ?';

  await db.exec(sql, [data, uuid]);
  res.sendStatus(200);
}

// delete a patient
async function remove(req, res) {
  const uuid = db.bid(req.params.uuid);
  const sql = `DELETE FROM ward WHERE uuid=?`;

  await db.exec(sql, uuid);
  res.sendStatus(204);
}

// get all wards
async function read(req, res) {
  const sql = `
    SELECT BUID(w.uuid) as uuid, w.name,
      w.description, BUID(w.service_uuid) as service_uuid,
      s.name as serviceName,
      (SELECT COUNT(*) FROM room WHERE room.ward_uuid = w.uuid) AS nb_rooms,
      (SELECT COUNT(*) FROM bed JOIN room ir ON ir.uuid = bed.room_uuid WHERE ir.ward_uuid = w.uuid) AS nb_beds
    FROM ward w
    LEFT JOIN service s ON s.uuid = w.service_uuid
  `;

  const wards = await db.exec(sql);
  res.status(200).json(wards);
}

// get a specific ward
async function detail(req, res) {
  const sql = `
    SELECT BUID(uuid) as uuid, name, description, BUID(service_uuid) as service_uuid
    FROM ward
    WHERE uuid=?
  `;
  const uuid = db.bid(req.params.uuid);
  const ward = await db.one(sql, uuid);
  res.status(200).json(ward);
}
