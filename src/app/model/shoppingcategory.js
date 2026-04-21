'use strict';

const mongoose = require('mongoose');
const shoppingcategorySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    slug: {
        type: String,
    },
    image: {
        type: String
    },
    parameter_type: {
        type: String
    },
    popular: {
        type: Boolean,
        default: false
    },
    is_refundable: {
        type: Boolean,
        default: true
    },
    attributes: [
        {
            name: { type: String },
            value: { type: String, default: '' }
        }
    ]
}, {
    timestamps: true
});

shoppingcategorySchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('ShoppingCategory', shoppingcategorySchema);