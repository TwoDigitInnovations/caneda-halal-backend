"use strict";

const mongoose = require("mongoose");

const ridePaymentOptionSchema = new mongoose.Schema(
  {
    online: {
      type: Boolean,
      default: false,
    },
    cash: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ridePaymentOptionSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("RidePaymentOption", ridePaymentOptionSchema);