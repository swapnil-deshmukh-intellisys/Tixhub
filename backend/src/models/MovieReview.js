const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("MovieReview", {
  rating: 0,
  comment: "",
  status: "published",
});
