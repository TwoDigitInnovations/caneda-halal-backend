'use strict';

const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    foodTaxRate: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    groceryTaxRate: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    shoppingTaxRate: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    rideOnlineTax: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Tax', taxSchema);
