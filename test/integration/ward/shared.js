/**
 * This file contains shared elements for ward management
 */

const testService = 'aff85bdc-d7c6-4047-afe7-1724f8cd369e';
const adminService = 'b1816006-5558-45f9-93a0-c222b5efa6cb';

const ward1 = {
  uuid : 'f5a72649-26c9-4f5d-bffa-098207a7f24d', // exists in db
  name : 'Pavillon A',
  description : 'Test pavillon A',
  service_uuid : testService,
};

const ward2 = {
  uuid : 'f4ce5f9f-edd3-4bd2-9b9c-43b116c02747', // exists in db
  name : 'Pavillon B',
  description : 'Test pavillon B',
  service_uuid : adminService,
};

const room1 = {
  uuid : 'a6f9527b-a7b4-4a2c-9f4f-dd7323bbcf72', // exists in db
  label : 'Room A in Ward A',
  ward_uuid : ward1.uuid,
  room_type_id : 1,
};

const room2 = {
  uuid : '3bd2c0db-6a57-4b74-8ae7-74554bcbc35d', // exists in db
  label : 'Room B in Ward B',
  ward_uuid : ward2.uuid,
};

const bed1 = {
  id : 10,
  label : 'Bed 1',
  room_uuid : room1.uuid,
};

const bed2 = {
  id : 11,
  label : 'Bed 2',
  room_uuid : room2.uuid,
};

module.exports = {
  ward1,
  ward2,
  room1,
  room2,
  bed1,
  bed2,
};
