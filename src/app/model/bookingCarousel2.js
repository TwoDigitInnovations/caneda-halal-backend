"use strict";

const mongoose = require("mongoose");

const bookingCarousel2Schema = new mongoose.Schema(
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

bookingCarousel2Schema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("BookingCarousel2", bookingCarousel2Schema); 