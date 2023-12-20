const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Read the existing dishes  and display it to the user
function list(req, res) {
  res.json({ data: dishes });
}

// Read the existing orders  and display them to the user
function read(req, res) {
  res.json({ data: res.locals.dish });
}

//Validate that dish record exist
function dishExist(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

//Create new dish record
function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//Update new dish record
function update(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const dish = res.locals.dish;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

// Validate that properties exist in request body
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

// Validate that request body Id is the same as in parameter id
function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (!id) {
    return next();
  }
  if (id === dishId) return next();
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// Validate that properties exist in the request body
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${propertyName}`,
    });
  };
}

// Validate price and throw error if price is not valid
function validatePrice(req, res, next) {
  const {
    data: { price },
  } = req.body;

  if (Number(price) < 1 || !Number.isInteger(price))
    next({
      status: 400,
      message: `price is not valid`,
    });
  return next();
}

module.exports = {
  list,
  read: [dishExist, read],
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    bodyDataIsEmpty("name"),
    bodyDataIsEmpty("description"),
    bodyDataIsEmpty("image_url"),
    validatePrice,
    create,
  ],
  update: [
    dishExist,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    bodyDataIsEmpty("name"),
    bodyDataIsEmpty("description"),
    bodyDataIsEmpty("image_url"),
    validatePrice,
    idMatches,
    update,
  ],
};
