const mongoose = require("mongoose");
const RidePaymentOption = mongoose.model("RidePaymentOption");
const response = require("./../responses");

module.exports = {
  createRidePaymentOption: async (req, res) => {
    try {
      const paymentOption = new RidePaymentOption(req.body);
      const result = await paymentOption.save();
      response.created(res, {
        message: "Ride Payment Option created successfully",
        ridePaymentOption: result,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },

  getRidePaymentOption: async (req, res) => {
    try {
      const paymentOptions = await RidePaymentOption.find({});
      response.ok(res, {
        message: "Ride Payment Options fetched successfully",
        ridePaymentOption: paymentOptions,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },

  updateRidePaymentOption: async (req, res) => {
    try {
      const payload = req.body;
      let paymentOption = await RidePaymentOption.findByIdAndUpdate(payload?.id, payload, {
        new: true,
      });
      response.ok(res, {
        message: "Ride Payment Option updated successfully",
        ridePaymentOption: paymentOption,
      });
    } catch (error) {
      response.error(res, error.message);
    }
  },
}; 