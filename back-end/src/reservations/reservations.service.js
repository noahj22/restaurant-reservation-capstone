const knex = require("../db/connection");

function create(reservation) {
  return knex("reservations")
    .insert(reservation, "*")
    .then((createdReservations) => createdReservations[0]);
}

function list(date) {
  if (date) {
    return knex("reservations")
      .select("*")
      .where({ reservation_date: date })
      .whereNotIn("status", ["finished", "cancelled"])
      .orderBy("reservation_time");
  }
  return knex("reservations").select("*").orderBy("reservation_time");
}

function search(mobile_number) {
  return knex("reservations")
    .select("*")
    .whereRaw(
      "translate(mobile_number, '() -', '') like ?",
      `%${mobile_number.replace(/\D/g, "")}%`
    )
    .orderBy("reservation_date");
}

function read(reservation_id) {
  return knex("reservations").select("*").where({ reservation_id }).first();
}

function update(updatedReservation) {
  return knex("reservations")
    .where({ reservation_id: updatedReservation.reservation_id })
    .update(updatedReservation)
    .returning("*")
    .then((data) => data[0]);
}
function updateStatus(reservation_id, status) {
  if (status) {
    return knex("reservations")
      .where({ reservation_id })
      .update({ status })
      .then(() => read(reservation_id));
  }
  return knex("reservations")
    .where({ reservation_id })
    .update({ status: "cancelled" })
    .then(() => read(reservation_id));
}

module.exports = {
  create,
  list,
  search,
  read,
  updateStatus,
  update,
};