const mongoose = require("mongoose");
const GroceryCarousel = mongoose.model("GroceryCarousel");
const response = require("../responses");

module.exports = {
  createGroceryCarousel: async (req, res) => {
    try {
      const notify = new GroceryCarousel(req.body);
      const noti = await notify.save();
      return res.status(201).json({
        success: true,
        message: "Data Saved successfully!",
        data: noti,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  },

  getGroceryCarousel: async (req, res) => {
    try {
      const notifications = await GroceryCarousel.find({});

      res.status(200).json({
        success: true,
        message: "Fetched all carosal successfully",
        grocerycarousel: notifications,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  },

  updateGroceryCarousel: async (req, res) => {
    try {
      const payload = req?.body || {};
      let category = await GroceryCarousel.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return res.status(200).json({
        success: true,
        message: "Updated successfully",
        grocerycarousel: category,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

};
