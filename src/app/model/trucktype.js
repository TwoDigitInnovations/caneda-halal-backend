"use strict";

const mongoose = require("mongoose");
const { uniq, unique } = require("underscore");

const trucktypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    vehicleimg: {
      type: String,
    },
    status: {
      type: String,
      default: "Active"
    },
    ratePerKm: {
      type: Number,
      required: true
    },
    maxPassengers: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TRUCKTYPE", trucktypeSchema);
