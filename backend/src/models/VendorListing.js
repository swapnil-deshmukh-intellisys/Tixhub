const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("VendorListing", {
  city: "",
  route: "",
  price: 0,
  inventory: 0,
  imageUrl: "",
  details: {},
  status: "active",
});
