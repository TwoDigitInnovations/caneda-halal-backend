'use strict';

const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  userProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  driverProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
}, { timestamps: true });


reviewSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Review', reviewSchema);