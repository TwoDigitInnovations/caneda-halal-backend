"use strict";

const mongoose = require("mongoose");

const poolSchema = new mongoose.Schema(
  {
    rides: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    }],
    status: {
      type: String,
      default: "pending",
    },
    
  },
  {
    timestamps: true,
  }
);
poolSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});


module.exports = mongoose.model("Pool", poolSchema);
