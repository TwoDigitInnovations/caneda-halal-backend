'use strict';

const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({

    title: {
        type: String,
      },
      description: {
        type: String,
      },
      type: {
        type: String,
        enum:['RIDE','FOOD','GROCERY','SHOPPING','DELIVERYRIDER']
      },
      for:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
   

}, {
    timestamps: true
});

notificationSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Notification', notificationSchema);