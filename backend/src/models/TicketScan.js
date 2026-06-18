const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("TicketScan", {
  status: "checked-in",
});
