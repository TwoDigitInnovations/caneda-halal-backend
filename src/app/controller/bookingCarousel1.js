const mongoose = require("mongoose");
const BookingCarousel1 = mongoose.model("BookingCarousel1");
const response = require("./../responses");

module.exports = {
  createBookingCarousel1: async (req, res) => {
    try {
      const notify = new BookingCarousel1(req.body);
      const result = await notify.save();
      response.created(res, {
        message: "Booking Carousel 1 created successfully",
        bookingcarousel1: result,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },

  getBookingCarousel1: async (req, res) => {
    try {
      const notifications = await BookingCarousel1.find({});
      response.ok(res, {
        message: "Booking Carousel 1 fetched successfully",
        bookingcarousel1: notifications,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },

  updateBookingCarousel1: async (req, res) => {
    try {
      const payload = req.body;
      let category = await BookingCarousel1.findByIdAndUpdate(payload?.id, payload, {
        new: true,
      });
      response.ok(res, {
        message: "Booking Carousel 1 updated successfully",
        bookingcarousel1: category,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },
}; 