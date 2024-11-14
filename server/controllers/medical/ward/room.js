const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

module.exports.create = create;
module.exports.update = update;
module.exports.delete = remove;
module.exports.read = read;
module.exports.detail = detail;

// register a new room
function create(req, res, next) {
  const data = req.body;
  data.uuid = db.bid(data.uuid || db.uuid());
  db.convert(data, ['ward_uuid']);
  const sql = 'INSERT INTO room SET ?';

  db.exec(sql, data).then(() => {
    res.sendStatus(201);
  })
    .catch(next);
}

// modify a room informations
function update(req, res, next) {
  const data = req.body;
  delete data.uuid;
  const uuid = db.bid(req.params.uuid);
  db.convert(data, ['ward_uuid']);
  const sql = `UPDATE room SET ? WHERE uuid =?`;

  db.exec(sql, [data, uuid])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next);
}

// delete a room
function remove(req, res, next) {
  const uuid = db.bid(req.params.uuid);
  const sql = `DELETE FROM room WHERE uuid=?`;

  db.exec(sql, uuid)
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
}

// get all rooms
function read(req, res, next) {
  lookupRooms(req.query)
    .then(rooms => {
      res.status(200).json(rooms);
    })
    .catch(next);
}

// get a specific room
function detail(req, res, next) {
  lookupRoom(req.params.uuid)
    .then(room => {
      res.status(200).json(room);
    })
    .catch(next);
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
