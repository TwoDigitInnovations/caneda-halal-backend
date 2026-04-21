const mongoose = require("mongoose");
const ShoppingCarousel = mongoose.model("ShoppingCarousel");
const response = require("../responses");

module.exports = {
  createShoppingCarousel: async (req, res) => {
    try {
      const notify = new ShoppingCarousel(req.body);
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

  getShoppingCarousel: async (req, res) => {
    try {
      const notifications = await ShoppingCarousel.find({});

      res.status(200).json({
        success: true,
        message: "Fetched all carosal successfully",
        shoppingcarousel: notifications,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  },

  updateShoppingCarousel: async (req, res) => {
    try {
      const payload = req?.body || {};
      let category = await ShoppingCarousel.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return res.status(200).json({
        success: true,
        message: "Updated successfully",
        shoppingcarousel: category,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

};
