"use strict";

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    offer: {
      type: Number,
    },
    plan: {
      type: Number,
    },
    type: {
      type: String,
    },
    period: {
      type: Number,
    },
    // currency: {
    //   type: String,
    // },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("subscription", subscriptionSchema);
