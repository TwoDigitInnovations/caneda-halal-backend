const mongoose = require("mongoose");
const Review = mongoose.model("Review");
const response = require("../responses");

module.exports = {
addreview: async (req, res) => {
    try {
      const payload = req?.body || {};
      const userId = req.user.id;
payload.userId = userId;
      const review = new Review(payload);
      await review.save();

      return response.ok(res, { message: "Review submitted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getridereview: async (req, res) => {
    try {
      const review = await Review.findOne({ride:req.params.id})

      if (!review) {
        return response.badReq(res, { message: "Review not found" });
      }

      return response.ok(res, review);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getallreviewBydriver: async (req, res) => {
    try {
      const userId = req.user.id;

      const allReviews = await Review.find({ driverId: userId })
        .populate("userProfile", "-password");

      return response.ok(res, allReviews);
    } catch (error) {
      return response.error(res, error);
    }
  },
}