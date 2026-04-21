const mongoose = require("mongoose");
const BookingCarousel2 = mongoose.model("BookingCarousel2");
const response = require("./../responses");

module.exports = {
  createBookingCarousel2: async (req, res) => {
    try {
      const notify = new BookingCarousel2(req.body);
      const result = await notify.save();
      response.created(res, {
        message: "Booking Carousel 2 created successfully",
        bookingcarousel2: result,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },

  getBookingCarousel2: async (req, res) => {
    try {
      const notifications = await BookingCarousel2.find({});
      response.ok(res, {
        message: "Booking Carousel 2 fetched successfully",
        bookingcarousel2: notifications,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },

  updateBookingCarousel2: async (req, res) => {
    try {
      const payload = req.body;
      let category = await BookingCarousel2.findByIdAndUpdate(payload?.id, payload, {
        new: true,
      });
      response.ok(res, {
        message: "Booking Carousel updated successfully",
        bookingcarousel2: category,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },
}; 