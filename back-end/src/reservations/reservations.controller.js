const service = require("./reservations.service.js");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const { date } = req.query;
  const { mobile_number } = req.query;
  let data;
  if (date) {
    data = await service.list(date);
  } else if (mobile_number) {
    data = await service.search(mobile_number);
  } else {
    data = await service.list();
  }
  res.json({ data });
}

async function create(req, res) {
  const data = await service.create(req.body.data);
  res.status(201).json({ data });
}

async function update(req, res) {
  const { reservation_id } = res.locals.reservation;
  const updatedReservation = {
    ...req.body.data,
    reservation_id,
  };
  const data = await service.update(updatedReservation);
  res.json({ data });
}

async function read(req, res) {
  const reservationId = res.locals.reservationId;
  const data = await service.read(reservationId);
  res.json({ data });
}

function hasValidFields(req, res, next) {
  const { data = {} } = req.body;
  const validFields = new Set([
    "first_name",
    "last_name",
    "mobile_number",
    "reservation_date",
    "reservation_time",
    "people",
    "status",
    "created_at",
    "updated_at",
    "reservation_id",
  ]);

  const invalidFields = Object.keys(data).filter(
    (field) => !validFields.has(field)
  );

  if (invalidFields.length)
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  next();
}

async function reservationExists(req, res, next) {
  const reservationId = req.params.reservationId;
  const reservation = await service.read(reservationId);
  if (reservation) {
    res.locals.reservation = reservation;
    res.locals.reservationId = reservationId;
    return next();
  } else {
    next({ status: 404, message: `Reservation not found: ${reservationId}` });
  }
}

function isResFinished(req, res, next) {
  const { status } = res.locals.reservation;
  if (status == "finished") {
    return next({ status: 400, message: `status is finished` });
  }
  next();
}

function isValid(req, res, next) {
  const { reservation_date, reservation_time, people } = req.body.data;
  let today = new Date();
  let day = `${reservation_date}  ${reservation_time}`;
  let resAsDate = new Date(day);
  const validNumber = Number.isInteger(people);

  const timeFormat = /\d\d:\d\d/;
  const dateReg = /^\d{4}\-\d{1,2}\-\d{1,2}$/;
  if (reservation_time.match(timeFormat) === null) {
    return next({
      status: 400,
      message: `The reservation_time is not valid.`,
    });
  }

  if (!reservation_date.match(dateReg)) {
    return next({
      status: 400,
      message: `The reservation_date is not valid.`,
    });
  }
  if (resAsDate.getDay() === 2) {
    return next({
      status: 400,
      message: `The Restaurant is closed on Tuesdays.`,
    });
  }
  if (resAsDate < today) {
    return next({
      status: 400,
      message: "Reservation must be booked for future date.",
    });
  }
  if (reservation_time < "10:30" || reservation_time > "21:30") {
    return next({
      status: 400,
      message: "Reservation must be between 10:30AM and 9:30PM.",
    });
  }
  if (!validNumber || people <= 0) {
    return next({
      status: 400,
      message: "You cannot make a reservation for 0 people.",
    });
  }
  next();
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function checkStatus(req, res, next) {
  const { data = {} } = req.body;
  if (data["status"] === "finished") {
    return next({ status: 400, message: `status is finished` });
  }
  if (data["status"] === "seated") {
    return next({ status: 400, message: `status is seated` });
  }
  next();
}

function checksStatus(req, res, next) {
  const data = req.body.data;
  if (data["status"] === "unknown") {
    return next({ status: 400, message: `status is undefined/unknown` });
  }
  next();
}

async function updateStatus(req, res) {
  const { reservation_id } = res.locals.reservation;
  const { status = null } = req.body.data;
  const data = await service.updateStatus(reservation_id, status);
  res.json({ data });
}

const has_first_name = bodyDataHas("first_name");
const has_last_name = bodyDataHas("last_name");
const has_mobile_number = bodyDataHas("mobile_number");
const has_reservation_date = bodyDataHas("reservation_date");
const has_reservation_time = bodyDataHas("reservation_time");
const has_people = bodyDataHas("people");

module.exports = {
  create: [
    hasValidFields,
    has_first_name,
    has_last_name,
    has_mobile_number,
    has_reservation_date,
    has_reservation_time,
    has_people,
    isValid,
    checkStatus,
    asyncErrorBoundary(create),
  ],
  read: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(read)],
  list: [asyncErrorBoundary(list)],
  updateStatus: [
    asyncErrorBoundary(reservationExists),
    isResFinished,
    checksStatus,
    asyncErrorBoundary(updateStatus),
  ],
  update: [
    hasValidFields,
    has_first_name,
    has_last_name,
    has_mobile_number,
    has_reservation_date,
    has_reservation_time,
    has_people,
    isValid,
    checkStatus,
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(update),
  ],
};