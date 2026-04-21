"use strict";

const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
  },
  coordinates: {
    type: [Number],
  },
});

const foodorderchema = new mongoose.Schema(
  {
    productDetail: [
      {
        food_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Foods",
        },
        food_name: {
          type: String,
        },
        image: {
          type: String,
        },
        qty: {
          type: Number,
        },
        price: {
          type: Number,
        },
      },
    ],
    order_id: {
      type: String
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    user_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    status: {
      type: String,
      default: "Pending",
      enum:['Pending','Preparing','Ready','Assign','Rejected','Collected','Delivered']
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    seller_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driver_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    shipping_address: {
      type: Object,
    },
    tax: {
      type: Number,
    },
    total: {
      type: Number,
    },
    delivery_fee: {
      type: Number,
    },
    delivery_tip: {
      type: Number,
    },
    total_deliverd_amount: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    final_amount: {
      type: Number,
    },
    location: {
      type: pointSchema,
    },
    paymentmode: {
      type: String,
    },
    paymentid: {
        type: String,
    },
    deliveredAt: {
      type: Date,
    },
    instruction: {
      type: String,
    },
    selfpickup: {
      type: Boolean,
    },
    pickupOTP: {
      type: Number,
    },
    scheduledelivery :{
      type:Boolean
    },
    scheduledate :{
      type:Date
    },
    scheduletimeslot :{
      type:String
    },
    rejectedbydriver: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);

foodorderchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
foodorderchema.index({ location: "2dsphere" });

module.exports = mongoose.model("FoodOrder", foodorderchema);
