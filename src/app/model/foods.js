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
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
}, { timestamps: true });

const foodschema = new mongoose.Schema({
    foodcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodCategory",
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
    name: {
        type: String,
    },
    image: [{
        type: String,
    }],
    description: {
        type: String,
    },
    // long_description: {
    //     type: String,
    // },
    price: {
        type: Number,
    },
    basic_ingridient: [{
        type: String,
    }],
    food_ingridient: [{
        type: String,
    }],
      sold_pieces: {
        type: Number,
        default: 0
    },
    favorite: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    reviews: [reviewSchema],
}, {
    timestamps: true
});

foodschema.path('favorite').default(() => []);
foodschema.path('reviews').default(() => []);

foodschema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Foods', foodschema);