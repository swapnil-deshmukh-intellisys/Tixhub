const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("VendorNotification", {
  type: "new_booking",
  title: "New booking alert",
  message: "",
  read: false,
});
