"use strict";

const mongoose = require("mongoose");
//const { uniq, unique } = require("underscore");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
  },
  coordinates: {
    type: [Number],
  },
});

const rideSchema = new mongoose.Schema(
  {
    src: {
      type: pointSchema,
    },
    dest: {
      type: pointSchema,
    },
    stops: [
      {
        address: {
          type: String,
        },
        location: {
          type: pointSchema,
        },
      },
    ],
    order_id: {
      type: String,
      unique: true,
    },
    delivery_tip: {
      type: Number,
    },
    price: {
      type: Number,
    },
    paymentid: {
      type: String,
    },
    payment_mode: {
      type: String,
    },
    service_fee: {
      type: Number,
    },
    final_price: {
      type: Number,
    },
    otp: {
      type: Number,
    },
    source: {
      type: String,
    },
    destination: {
      type: String,
    },
    duration: {
      type: Number,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    user_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    user_name: {
      type: String,
    },
    user_number: {
      type: String,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vehicle_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TRUCKTYPE",
    },
    driver_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    rejectedbydriver: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    ride_mode: {
      type: String,
      enum: ["private", "pool"],
      default: "private",
    },
    req_join_driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      default: "pending",
      // enum:['pending','started','cancel','complete']
    },
    scheduleride: {
      type: Boolean,
    },
    date: {
      type: Date,
    },
    ///only for pool ride
    route: {
      type: { type: String, default: "LineString" },
      coordinates: [[Number]], // [[lng, lat], [lng, lat], ...]
    },
  },
  {
    timestamps: true,
  }
);
rideSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

rideSchema.index({ src: "2dsphere" });
rideSchema.index({ dest: "2dsphere" });
rideSchema.index({ route: "2dsphere" });

module.exports = mongoose.model("Ride", rideSchema);
