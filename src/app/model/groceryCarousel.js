"use strict";

const mongoose = require("mongoose");

const groceryCarouselSchema = new mongoose.Schema(
  {
    carousel: [
      {
        image: {
          type: String,
        },
        grocery_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Grocery",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
groceryCarouselSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("GroceryCarousel", groceryCarouselSchema);
