"use strict";

const mongoose = require("mongoose");
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const profileSchema = new mongoose.Schema(
  {
    //common
    image: {
      type: String,
    },
    username: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    role: {
      type: String,
      enum: [
        "RIDEUSER",
        "RIDEDRIVER",
        "FOODUSER",
        "FOODSELLER",
        "GROCERYUSER",
        "GROCERYSELLER",
        "SHOPPINGUSER",
        "SHOPPINGSELLER",
        "DELIVERYRIDER",
        "FLIGHTUSER",
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: pointSchema,
    },
    current_location: {
      type: pointSchema,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    home_address: {
      main_address: {
        type: String,
      },
      secendary_address: {
        type: String,
      },
      location: {
        type: pointSchema,
      },
    },
    work_address: {
      main_address: {
        type: String,
      },
      secendary_address: {
        type: String,
      },
      location: {
        type: pointSchema,
      },
    },
    shipping_address: {
      type: Object,
    },

    //////////////ride driver////////////

    national_id_no: {
      type: String,
    },
    national_id: {
      type: String,
    },
    dl_number: {
      type: String,
    },
    number_plate_no: {
      type: String,
    },
    dl_image: {
      type: String,
    },
    number_plate_image: {
      type: String,
    },
    vehicle_image: {
      type: String,
    },
    address_support_letter: {
      type: String,
    },
    sin_number: {
      type: String,
    },
    background_check_document: {
      type: String,
    },
    wallet: {
      type: Number,
      default:0
    },
    vehicle_company: {
      type: String,
    },
    vehicle_model: {
      type: String,
    },
    vehicle_colour: {
      type: String,
    },
    vehicle_year: {
      type: String,
    },
    vehicle_type: {
      type: String,
    },
    vehicle_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TRUCKTYPE",
    },
    status: {
      type: String,
      default: "Pending",
      // enum: ["Pending", "Approved", "Rejected"],
    },
     paymentid: {
      type: String,
    },
    planExp: {
      type: Date,
    },
    subscriptiondata:{
      type:Object
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscription",
    },

    ////////// Food Seller/////////
    store_name: {
      type: String,
    },
    store_doc: {
      type: String,
    },
    tax_no: {
      type: String,
    },
    store_logo: {
      type: String,
    },
    store_cover_img: {
      type: String,
    },
    available_days: {
      type: Array,
    },
    opeing_time: {
      type: String,
    },
    close_time: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
profileSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
profileSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Profile", profileSchema);
