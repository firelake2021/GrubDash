const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function orderExist(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (!data[propertyName] || data[propertyName] == "") {
      next({
        status: 400,
        message: `Must include a ${propertyName}`,
      });
    }
    return next();
  };
}

function bodyDataIsEmpty(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName].length > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Must not be an empty string in a ${propertyName}`,
    });
  };
}

function validateDishes(req, res, next) {
  const { data } = req.body;
  const dishes = data.dishes;

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }

  if (Number(dishes[0].price) < 1 || !Number.isInteger(dishes[0].price))
    next({
      status: 400,
      message: `price must be not 0`,
    });
  res.locals.dishes = dishes;
  return next();
}

function validateDishQuantity(req, res, next) {
  const { data } = req.body;
  const dishes = data.dishes;
  for (let i = 0; i < dishes.length; i++) {
    if (!checkQuantity(dishes[i])) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
}

function checkQuantity(dish) {
  const { quantity = {} } = dish;

  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    console.log("quantity validateDishQuantity");
    return false;
  }
  return true;
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const dishesToString = JSON.stringify(dishes);
  const dishesToObject = JSON.parse(dishesToString);

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishesToObject,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (!id) return next();
  if (id === orderId) return next();
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}
function update(req, res) {
  foundOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const dishesToString = JSON.stringify(dishes);
  const dishesToObject = JSON.parse(dishesToString);
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishesToObject;
  res.json({ data: foundOrder });
}

function validateOrderStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (!status)
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  if (status === "delivered")
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  return next();
}

function validateOrderStatusStage(req, res, next) {
  const { data: { status } = {} } = req.body;
  const orderStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  console.log("status", status);
  if (!status || !orderStatuses.includes(status)) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  return next();
}

function validateOrderStatusForDeletion(req, res, next) {
  const orderToDelete = res.locals.order;
  if (orderToDelete.status !== "pending")
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  return next();
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExist, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataIsEmpty("mobileNumber"),
    validateDishes,
    validateDishQuantity,
    create,
  ],
  update: [
    orderExist,
    idMatches,
    validateOrderStatus,
    validateOrderStatusStage,
    validateDishes,
    validateDishQuantity,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataIsEmpty("mobileNumber"),
    update,
  ],
  delete: [orderExist, validateOrderStatusForDeletion, destroy],
};
