"use strict";

const mongoose = require("mongoose");

const shoppingCarouselSchema = new mongoose.Schema(
  {
    carousel: [
      {
        image: {
          type: String,
        },
        shopping_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shopping",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
shoppingCarouselSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("ShoppingCarousel", shoppingCarouselSchema);
