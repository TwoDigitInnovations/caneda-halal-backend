"use strict";

const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    line_1: String,
    city: String,
    state: String,
    postal_code: String,
    country_alpha2: String,
    company_name: String,
    contact_name: String,
    contact_phone: String,
    contact_email: String,
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    quantity: Number,
    contains_battery_pi966: Boolean,
    contains_battery_pi967: Boolean,
    contains_liquids: Boolean,
    origin_country_alpha2: String,
    hs_code: String,
    description: String,
    category: String,
    declared_currency: String,
    declared_customs_value: Number,
  },
  { _id: false }
);

const parcelSchema = new mongoose.Schema(
  {
    box: {
      length: Number,
      width: Number,
      height: Number,
    },
    items: [itemSchema],
    total_actual_weight: Number,
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    // Easyship returned ID
    easyship_shipment_id: {
      type: String,
      index: true,
    },

    origin_address: addressSchema,
    destination_address: addressSchema,

    incoterms: {
      type: String,
      enum: ["DDU", "DDP"],
    },

    insurance: {
      is_insured: Boolean,
    },

    courier_settings: {
      allow_fallback: Boolean,
      apply_shipping_rules: Boolean,
      courier_service_id: String,
      list_unavailable_services: Boolean,
    },

    shipping_settings: {
      additional_services: {
        qr_code: String,
      },
      units: {
        weight: String,
        dimensions: String,
      },
      buy_label: Boolean,
      buy_label_synchronous: Boolean,
      printing_options: {
        format: String,
        label: String,
        commercial_invoice: String,
        packing_slip: String,
      },
    },

    parcels: [parcelSchema],

    return: {
      type: Boolean,
      default: false,
    },

    set_as_residential: {
      type: Boolean,
      default: false,
    },

    // Shipment lifecycle
    status: {
      type: String,
      default: "created",
    },

    // Optional reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },


  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },


  courierName: String,
  courierService: String,

  trackingNumber: String,
  trackingPageUrl: String,
  labelUrl: String,


  easyshipTrackingStatus: String,

  checkpoints: [
    {
      location: String,
      message: String,
      status: String,
      trackedAt: Date
    }
  ],

  failureReason: String,
  },
  {
    timestamps: true,
  }
);

shipmentSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Shipping", shipmentSchema);
