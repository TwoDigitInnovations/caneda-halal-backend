'use strict';

const mongoose = require('mongoose');
const foodcategorySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    image: {
        type: String
    },
}, {
    timestamps: true
});

foodcategorySchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('FoodCategory', foodcategorySchema);