const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const service = require("./tables.service.js");
const reservationsService = require("../reservations/reservations.service");

async function create(req, res) {
  const data = await service.create(req.body.data);
  res.status(201).json({ data });
}

async function list(req, res) {
  const data = await service.list();
  res.json({ data });
}

async function read(req, res) {
  const data = res.locals.foundTable;
  res.status(200).json({ data });
}

function dataExists(req, res, next) {
  const data = req.body.data;
  if (!data) {
    return next({
      status: 400,
      message: `missing data`,
    });
  }
  next();
}

async function update(req, res) {
  const { foundTable } = res.locals;
  const { data: newData } = req.body;
  const data = await service.update(newData, foundTable.table_id);
  res.json({ data });
}

async function resIdExists(req, res, next) {
  const { reservation_id } = req.body.data;
  if (!reservation_id) {
    return next({
      status: 400,
      message: "A reservation_id is required",
    });
  }
  const reservation = await reservationsService.read(reservation_id);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  } else {
    next({
      status: 404,
      message: `reservation_id does not exist. No Id matches with ${reservation_id}`,
    });
  }
}

function isResSeated(req, res, next) {
  const { status } = res.locals.reservation;
  if (status == "seated") {
    return next({ status: 400, message: "reservation is already seated" });
  }
  next();
}

async function tableExists(req, res, next) {
  const { table_id } = req.params;
  const foundTable = await service.read(table_id);
  if (foundTable) {
    res.locals.foundTable = foundTable;
    return next();
  } else {
    next({ status: 404, message: `table not found: ${table_id}` });
  }
}

function isTableOccupied(req, res, next) {
  const { foundTable } = res.locals;
  if (foundTable.reservation_id === null) {
    return next({
      status: 400,
      message: "Table is not occupied.",
    });
  }
  next();
}

async function destroy(req, res, next) {
  const { table_id } = req.params;
  const { foundTable } = res.locals;
  await service.clearTable(table_id, foundTable.reservation_id);
  res.status(200).json({});
}

function tableIsFree(req, res, next) {
  const occupied = res.locals.foundTable.reservation_id;
  if (occupied) {
    return next({
      status: 400,
      message: `Table ${res.locals.foundTable.table_id} is currently occupied. Please select another table.`,
    });
  }
  next();
}

function canResFitAtTable(req, res, next) {
  const people = res.locals.reservation.people;
  const capacity = res.locals.foundTable.capacity;
  if (people > capacity) {
    return next({
      status: 400,
      message:
        "Party size is greater than the table capacity. Please select another.",
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

function isValidCap(propertyName) {
  return function (req, res, next) {
    const data = req.body.data;
    if (typeof data[propertyName] === "number") {
      return next();
    }
    next({ status: 400, message: `Invalid capacity` });
  };
}

function hasLength(propertyName) {
  return function (req, res, next) {
    const data = req.body.data;
    if (data[propertyName].length < 2) {
      return next({ status: 400, message: `table_name is too short.` });
    }
    next();
  };
}

const cap = isValidCap("capacity");
const length = hasLength("table_name");
const has_table_name = bodyDataHas("table_name");
const has_cap = bodyDataHas("capacity");

module.exports = {
  create: [has_table_name, has_cap, cap, length, asyncErrorBoundary(create)],
  list: [asyncErrorBoundary(list)],
  read: [asyncErrorBoundary(tableExists), asyncErrorBoundary(read)],
  update: [
    dataExists,
    asyncErrorBoundary(resIdExists),
    isResSeated,
    asyncErrorBoundary(tableExists),
    tableIsFree,
    canResFitAtTable,
    asyncErrorBoundary(update),
  ],
  delete: [
    asyncErrorBoundary(tableExists),
    isTableOccupied,
    asyncErrorBoundary(destroy),
  ],
};