const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("User", {
  role: "user",
  status: "active",
  image: "",
});
