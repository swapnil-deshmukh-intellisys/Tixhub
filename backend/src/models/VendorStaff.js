const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("VendorStaff", {
  role: "Ticket Checker",
  loginPermission: false,
  status: "active",
});
