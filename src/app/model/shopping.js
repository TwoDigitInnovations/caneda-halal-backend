'use strict';

const mongoose = require('mongoose');
const shoppingchema = new mongoose.Schema({
    shoppingcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShoppingCategory",
    },
    sellerid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    seller_profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
          },
    categoryName: {
        type: String,
    },
    origin: {
        type: String,
    },
    manufacturername: {
        type: String,
    },
    manufactureradd: {
        type: String,
    },
    expirydate: {
        type: Date,
    },
    name: {
        type: String,
    },
    slug: {
        type: String,
    },
    image: [{
        type: String,
    }],
    short_description: {
        type: String,
    },
    long_description: {
        type: String,
    },
    // price: {
    //     type: Number,
    // },
    // offer: {
    //     type: Number,
    // },
    pieces: {
        type: Number,
    },
    sold_pieces: {
        type: Number,
        default: 0
    },
    variants: {
        type: [],
    },
    decoration_method: [],
    decoration_location: [],
    minQuantity: {
        type: Number
    },
    parameter_type: {
        type: String
    },
    // price_slot: [{
    //     unit: {
    //         type: String
    //     },
    //     value: {
    //         type: String,
    //     },
    //     our_price: {
    //         type: Number,
    //         default: 0
    //     },
    //     other_price: {
    //         type: Number,
    //         default: 0
    //     },
    // }],
    is_verified: {
        type: Boolean,
        default: false
    },
    is_quality: {
        type: Boolean,
        default: false
    },
    sponsered: {
        type: Boolean
    },
    status: {
        type: String,
        enum: ["verified", "suspended"],
        default: "verified",
      },
    attributes: [
        {
            name: { type: String },
            value: { type: String, default: '' }
        }
    ],
    favorite: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
    }, { timestamps: true }],
}, {
    timestamps: true
});

shoppingchema.path('favorite').default(() => []);
shoppingchema.path('reviews').default(() => []);

shoppingchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Shopping', shoppingchema);