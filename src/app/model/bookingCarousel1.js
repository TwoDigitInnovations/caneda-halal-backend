"use strict";

const mongoose = require("mongoose");

const bookingCarousel1Schema = new mongoose.Schema(
  {
    carousel: [
      {
        image: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

bookingCarousel1Schema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("BookingCarousel1", bookingCarousel1Schema); 