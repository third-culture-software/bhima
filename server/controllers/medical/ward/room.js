const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.read = read;
module.exports.detail = detail;

// register a new room
async function create(req, res) {
  const data = req.body;
  data.uuid = db.bid(data.uuid || db.uuid());
  db.convert(data, ['ward_uuid']);
  const sql = 'INSERT INTO room SET ?';

  await db.exec(sql, data);
  res.sendStatus(201);
}

// modify a room informations
async function update(req, res) {
  const data = req.body;
  delete data.uuid;
  const uuid = db.bid(req.params.uuid);
  db.convert(data, ['ward_uuid']);
  const sql = `UPDATE room SET ? WHERE uuid =?`;

  await db.exec(sql, [data, uuid]);
  res.sendStatus(200);
}

// delete a room
async function remove(req, res) {
  const uuid = db.bid(req.params.uuid);
  const sql = `DELETE FROM room WHERE uuid=?`;

  await db.exec(sql, uuid);
  res.sendStatus(204);
}

// get all rooms
async function read(req, res) {
  const rooms = await lookupRooms(req.query);
  res.status(200).json(rooms);
}

// get a specific room
async function detail(req, res) {
  const room = await lookupRoom(req.params.uuid);
  res.status(200).json(room);
}

// lookup a room
function lookupRoom(uuid) {
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, 
      BUID(w.uuid) AS ward_uuid, w.name AS ward_name, r.description,
      s.name AS service_name
    FROM room r
    JOIN ward w ON w.uuid = r.ward_uuid
    LEFT JOIN service s ON s.uuid = w.service_uuid
    WHERE r.uuid=?
  `;
  return db.one(sql, [db.bid(uuid)]);
}

// lookup rooms
function lookupRooms(options) {
  const sql = `
    SELECT BUID(r.uuid) as uuid, r.label, 
      BUID(w.uuid) AS ward_uuid, w.name AS ward_name, r.description,
      s.name AS service_name,
      (SELECT COUNT(*) FROM bed WHERE bed.room_uuid = r.uuid) AS nb_beds
    FROM room r
    JOIN ward w ON w.uuid = r.ward_uuid
    LEFT JOIN service s ON s.uuid = w.service_uuid
  `;

  db.convert(options, ['ward_uuid']);

  const filters = new FilterParser(options);
  filters.equals('ward_uuid', 'uuid', 'w');
  filters.setOrder('ORDER BY ward_name, label');

  const query = filters.applyQuery(sql);
  const queryParameters = filters.parameters();

  return db.exec(query, queryParameters);
}
