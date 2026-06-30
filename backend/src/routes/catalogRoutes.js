const express = require("express");
const VendorListing = require("../models/VendorListing");

const router = express.Router();

router.get("/catalog/:module", async (req, res) => {
  try {
    const moduleMap = {
      flights: "flight",
      trains: "train",
      buses: "bus",
      bus: "bus",
      hotels: "hotel",
      holidays: "travel-package",
      events: "event",
    };

    const moduleName = moduleMap[req.params.module];

    if (!moduleName) {
      return res.json([]);
    }

    const listings = await VendorListing.find({
      module: moduleName,
      status: "active",
    }).sort({ createdAt: -1 });

    const data = listings.map((item) => {
      const d = item.details || {};

      return {
        id: item._id,
        title:
          d.operatorName ||
          d.airlineName ||
          d.hotelName ||
          d.eventTitle ||
          d.packageTitle ||
          item.title,
        subtitle:
          d.fromCity && d.toCity
            ? `${d.fromCity} to ${d.toCity}`
            : d.location || d.destination || "",
        date:
          d.departureDate ||
          d.eventDate ||
          d.checkInDate ||
          d.startDate ||
          "",
        price:
          d.price ||
          d.ticketPrice ||
          d.pricePerNight ||
          d.pricePerPerson ||
          0,
        rating: "4.5",
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Catalog error:", error);
    res.status(500).json({ message: "Unable to load catalog" });
  }
});

module.exports = router;