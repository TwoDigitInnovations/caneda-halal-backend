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

const shoppingorderchema = new mongoose.Schema(
  {
    productDetail: [
      {
        shopping_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shopping",
        },
        shopping_name: {
          type: String,
        },
        image: {
            type: String,
          },
        total: {
          type: Number,
        },
        qty: {
          type: Number,
        },
        price: {
          type: Number,
        },
        selected_size: {
          type: Object,
        },
        price_slot: {
          value: { type: Number },
          unit: { type: String },
          our_price: { type: Number },
          other_price: { type: Number },
        },
        // // return and refund related
        // isReturnable: { type: Boolean}, // capture it from product at order time
        // returnDetails: {
        //   isReturned: { type: Boolean, default: false}, // for return request
        //   isRefunded: { type: Boolean, default: false}, // for refund request
        //   returnRequestDate: Date, // for return request date
        //   returnDate: Date, // for return date when product is picked up again by seller
        //   returnStatus: {
        //     type: String,
        //     enum: [
        //       "Pending",
        //       "Approved",
        //       "Rejected",
        //       "Refunded",
        //       "Auto-Refunded",
        //       "Return-requested",
        //       "Completed",
        //     ],
        //   }, // status of the return and refund
        //   reason: String, // reason for return and refund
        //   proofImages: [String], // images for proof of return and refund
        //   refundAmount: Number, // amount to be refunded
        //   refundedAt: Date, // date when refund is processed
        //   refundWithoutReturn: { type: Boolean}, // for refund without return ----> for auto-refund
        // },
      },
    ],
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
    // onthewaytodelivery: {
    //   type: Boolean,
    //   default: false,
    // },
    shipping_address: {
      type: Object,
    },
    tax: {
      type: Number,
      default: 0,
    },
    servicefee: {
      type: Number,
      default: 0,
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
    // timeslot: {
    //   type: String,
    // },
    // cashcollected: {
    //   type: String,
    //   enum: ["Yes", "No"],
    //   default: "No",
    // },
    // amountreceivedbyadmin: {
    //   type: String,
    //   enum: ["Yes", "No"],
    //   default: "No",
    // },
    deliveredAt: {
      type: Date,
    },
    order_id:{
      type: String,
      unique: true,
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

shoppingorderchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
shoppingorderchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ShoppingOrder", shoppingorderchema);
