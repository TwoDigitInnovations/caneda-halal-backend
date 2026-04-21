'use strict';

const mongoose = require('mongoose');
const grocerycategorySchema = new mongoose.Schema({
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

grocerycategorySchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('GroceryCategory', grocerycategorySchema);